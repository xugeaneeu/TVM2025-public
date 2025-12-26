import { Arith, Bool, Context, Model, init } from "z3-solver";

import { printFuncCall } from "./printFuncCall";
import {
    AnnotatedModule,
    AnnotatedFunctionDef,
} from "../../lab10";
import {
    Expr,
    Condition,
    Predicate,
    Statement,
    ParameterDef,
    fail,
    ErrorCode,
} from "../../lab08";

let z3anchor: any;
let z3: Context;

async function initZ3() {
    if (!z3) {
        z3anchor = await init();
        const Z3C = z3anchor.Context;
        z3 = Z3C("main");
    }
}

export function flushZ3() {
    z3anchor = undefined;
    z3 = undefined as any;
}

type AssignmentStatement = Extract<Statement, { type: "assign" }>;
type FunctionCallExpression = Extract<Expr, { type: "funccall" }>;

type DefinitionalSpec = {
    params: string[];
    resultExpr: Expr;
};

const TRUE_PREDICATE: Predicate = { kind: "true" };
const FALSE_PREDICATE: Predicate = { kind: "false" };

type SourceRange = {
    startLine?: number;
    startCol?: number;
    endLine?: number;
    endCol?: number;
};

function getSourceLocation(node: any): SourceRange | undefined {
    return node?.blame ?? node?.loc;
}

function copyMetadata(target: any, source: any) {
    if (!target || !source) return;
    if (source.loc && !target.loc) target.loc = source.loc;
    if (source.blame && !target.blame) target.blame = source.blame;
}

function attachBlame<T extends object>(obj: T, pos?: SourceRange): T {
    if (pos) (obj as any).blame = pos;
    return obj;
}

class FunctionVerifier {
    private readonly z3Context: Context;
    private readonly module: AnnotatedModule;
    private readonly functionDefinitionMap: Map<string, AnnotatedFunctionDef>;
    private readonly definitionalSpecs: Map<string, DefinitionalSpec>;

    private z3FunctionCache = new Map<string, any>();

    constructor(ctx: Context, module: AnnotatedModule) {
        this.z3Context = ctx;
        this.module = module;
        this.functionDefinitionMap = new Map(module.functions.map(f => [f.name, f]));
        this.definitionalSpecs = this.buildDefinitionalSpecs();
    }

    async verify(): Promise<void> {
        for (const funcDef of this.module.functions) {
            await this.verifyFunction(funcDef);
        }
    }

    private buildDefinitionalSpecs(): Map<string, DefinitionalSpec> {
        return new Map(
            this.module.functions.flatMap(funcDef => {
                if (funcDef.returns.length !== 1 || !funcDef.post) return [];
                const spec = this.extractDefinitionalSpec(funcDef.returns[0], funcDef.post, funcDef.parameters);
                return spec ? [[funcDef.name, spec] as const] : [];
            })
        );
    }

    private extractDefinitionalSpec(retParam: ParameterDef, postCondition: Predicate, params: ParameterDef[]) {
        let currentPredicate = postCondition;
        while (currentPredicate.kind === "paren") currentPredicate = currentPredicate.inner;
        
        if (currentPredicate.kind !== "comparison" || currentPredicate.op !== "==") return;

        const isReturnVar = (e: Expr) => e.type === "var" && e.name === retParam.name;
        const paramNames = params.map(p => p.name);

        if (isReturnVar(currentPredicate.left)) return { params: paramNames, resultExpr: currentPredicate.right };
        if (isReturnVar(currentPredicate.right)) return { params: paramNames, resultExpr: currentPredicate.left };
    }

    private async verifyFunction(funcDef: AnnotatedFunctionDef): Promise<void> {
        const postCondition = funcDef.post ?? TRUE_PREDICATE;
        const preCondition = funcDef.pre ?? TRUE_PREDICATE;

        const postLocation = getSourceLocation(postCondition);

        const { pre: calculatedPre, vcs: verificationConditions } = this.computeWeakestPrecondition(funcDef, funcDef.body, postCondition);

        const allConditions = [calculatedPre, ...verificationConditions];

        for (const condition of allConditions) {
            const goal = this.createImplication(preCondition, condition);
            attachBlame(goal, getSourceLocation(condition) ?? postLocation);
            await this.proveGoal(goal, funcDef);
        }
    }

    private getZ3FunctionDeclaration(name: string, arity: number, returnType: "int" | "bool") {
        const cacheKey = `${name}/${arity}/${returnType}`;
        if (!this.z3FunctionCache.has(cacheKey)) {
            const domainSorts = Array.from({ length: arity }, () => this.z3Context.Int.sort());
            const rangeSort = returnType === "int" ? this.z3Context.Int.sort() : this.z3Context.Bool.sort();
            const decl = this.z3Context.Function.declare(name, ...domainSorts, rangeSort);
            this.z3FunctionCache.set(cacheKey, decl);
        }
        return this.z3FunctionCache.get(cacheKey);
    }

    private forEachCallInExpression(expr: Expr, visitor: (call: FunctionCallExpression) => void): void {
        if (expr.type === "funccall") visitor(expr);

        const children: Expr[] =
            expr.type === "funccall" ? expr.args :
                expr.type === "bin" ? [expr.left, expr.right] :
                    expr.type === "neg" ? [expr.arg] :
                        expr.type === "arraccess" ? [expr.index] :
                            [];

        children.forEach(child => this.forEachCallInExpression(child, visitor));
    }

    private forEachCallInPredicate(pred: Predicate, visitor: (call: FunctionCallExpression) => void): void {
        if (pred.kind === "comparison") {
            this.forEachCallInExpression(pred.left, visitor);
            this.forEachCallInExpression(pred.right, visitor);
            return;
        }

        const children: Predicate[] =
            pred.kind === "and" || pred.kind === "or" ? [pred.left, pred.right] :
                pred.kind === "not" ? [pred.predicate] :
                    pred.kind === "paren" ? [pred.inner] :
                        pred.kind === "quantifier" ? [pred.body] :
                            [];

        children.forEach(child => this.forEachCallInPredicate(child, visitor));
    }

    private createSubstitutionMapForCall(calleeDef: AnnotatedFunctionDef, callExpr: FunctionCallExpression): Map<string, Expr> {
        return new Map(calleeDef.parameters.map((param, index) => [param.name, callExpr.args[index]] as const));
    }

    private guardCallPreconditions(pred: Predicate): Predicate {
        const keepMetadata = <T extends Predicate>(output: T): T => {
            copyMetadata(output, pred);
            return output;
        };

        switch (pred.kind) {
            case "comparison": {
                let guardedPredicate: Predicate = pred;

                const wrapWithPrecondition = (callExpr: FunctionCallExpression) => {
                    const calleeDef = this.functionDefinitionMap.get(callExpr.name);
                    const calleePre = calleeDef?.pre ?? TRUE_PREDICATE;
                    const subs = this.createSubstitutionMapForCall(calleeDef!, callExpr);
                    const substitutedPre = this.substitutePredicate(calleePre, subs);
                    guardedPredicate = this.createConjunction(substitutedPre, guardedPredicate);
                };

                this.forEachCallInExpression(pred.left, wrapWithPrecondition);
                this.forEachCallInExpression(pred.right, wrapWithPrecondition);

                copyMetadata(guardedPredicate, pred);
                return guardedPredicate;
            }

            case "and":
            case "or":
                return keepMetadata({
                    kind: pred.kind,
                    left: this.guardCallPreconditions(pred.left),
                    right: this.guardCallPreconditions(pred.right),
                });

            case "not":
                return keepMetadata({
                    kind: "not",
                    predicate: this.guardCallPreconditions(pred.predicate),
                });

            case "paren": {
                const inner = this.guardCallPreconditions(pred.inner);
                copyMetadata(inner, pred);
                return inner;
            }

            case "quantifier":
                return {
                    ...(pred),
                    body: this.guardCallPreconditions(pred.body),
                } as Predicate;

            default:
                return pred;
        }
    }

    private createSubstitutionMapFromAssignment(stmt: AssignmentStatement): Map<string, Expr> {
        return new Map(
            stmt.targets.flatMap((target, index) => (target.type === "lvar" ? [[target.name, stmt.exprs[index]] as const] : []))
        );
    }

    private computeWeakestPrecondition(
        funcDef: AnnotatedFunctionDef,
        stmt: Statement,
        postCondition: Predicate
    ): { pre: Predicate; vcs: Predicate[] } {
        switch (stmt.type) {
            case "expr":
                return { pre: postCondition, vcs: [] };

            case "assign": {
                const subs = this.createSubstitutionMapFromAssignment(stmt);
                return { pre: this.substitutePredicate(postCondition, subs), vcs: [] };
            }

            case "block": {
                let currentPostCondition = postCondition;
                let accumulatedVCs: Predicate[] = [];

                for (let i = stmt.stmts.length - 1; i >= 0; i--) {
                    const statement = stmt.stmts[i];

                    const result = this.computeWeakestPrecondition(funcDef, statement, currentPostCondition);
                    currentPostCondition = result.pre;

                    if (statement.type === "assign") {
                        const subs = this.createSubstitutionMapFromAssignment(statement);
                        if (subs.size) {
                            accumulatedVCs = accumulatedVCs.map(vc => this.substitutePredicate(vc, subs));
                        }
                    }

                    accumulatedVCs.push(...result.vcs);
                }

                return { pre: currentPostCondition, vcs: accumulatedVCs };
            }

            case "if": {
                const conditionPredicate = this.convertConditionToPredicate(stmt.condition);
                const thenResult = this.computeWeakestPrecondition(funcDef, stmt.then, postCondition);
                const elseResult = stmt.else
                    ? this.computeWeakestPrecondition(funcDef, stmt.else, postCondition)
                    : { pre: postCondition, vcs: [] };

                const thenPre = thenResult.pre;
                const elsePre = elseResult.pre;

                const pre = this.createConjunction(
                    this.createImplication(conditionPredicate, thenPre),
                    this.createImplication(this.createNegation(conditionPredicate), elsePre)
                );

                return { pre, vcs: [...thenResult.vcs, ...elseResult.vcs] };
            }

            case "while": {
                const invariant = stmt.invariant ?? TRUE_PREDICATE;
                const conditionPredicate = this.convertConditionToPredicate(stmt.condition);

                // 1. Invariant is preserved by the body: (Inv && Cond) => WP(Body, Inv)
                const bodyResultInvariant = this.computeWeakestPrecondition(funcDef, stmt.body, invariant);
                const vcPreserveInvariant = this.createImplication(
                    this.createConjunction(invariant, conditionPredicate),
                    bodyResultInvariant.pre
                );

                // 2. Loop exit logic
                // Post-condition after loop body executes one more time and exits: Inv && (!Cond => Post)
                const postAfterBody = this.createConjunction(
                    invariant,
                    this.createImplication(this.createNegation(conditionPredicate), postCondition)
                );
                
                const bodyResultExit = this.computeWeakestPrecondition(funcDef, stmt.body, postAfterBody);
                const vcOneStepExit = this.createImplication(
                    this.createConjunction(invariant, conditionPredicate),
                    bodyResultExit.pre
                );

                // 3. Exit condition: (Inv && !Cond) => Post
                const vcLoopExit = this.createImplication(
                    this.createConjunction(invariant, this.createNegation(conditionPredicate)),
                    postCondition
                );

                const invLocation = getSourceLocation(invariant);
                const postLocation = getSourceLocation(postCondition);

                attachBlame(vcPreserveInvariant, invLocation);
                attachBlame(vcOneStepExit, invLocation);
                attachBlame(vcLoopExit, postLocation ?? invLocation);

                return {
                    pre: invariant,
                    vcs: [
                        vcPreserveInvariant,
                        vcOneStepExit,
                        vcLoopExit,
                        ...bodyResultInvariant.vcs,
                        ...bodyResultExit.vcs,
                    ],
                };
            }
        }
    }

    private convertConditionToPredicate(cond: Condition): Predicate {
        switch (cond.kind) {
            case "implies":
                return this.createImplication(this.convertConditionToPredicate(cond.left), this.convertConditionToPredicate(cond.right));
            case "not":
                return this.createNegation(this.convertConditionToPredicate(cond.condition));
            case "and":
                return this.createConjunction(this.convertConditionToPredicate(cond.left), this.convertConditionToPredicate(cond.right));
            case "or":
                return this.createDisjunction(this.convertConditionToPredicate(cond.left), this.convertConditionToPredicate(cond.right));
            case "paren":
                return this.convertConditionToPredicate(cond.inner);
            default:
                return cond as Predicate;
        }
    }

    private createConjunction(a: Predicate, b: Predicate): Predicate {
        if (a.kind === "true") return b;
        if (b.kind === "true") return a;
        if (a.kind === "false" || b.kind === "false") return FALSE_PREDICATE;
        return { kind: "and", left: a, right: b };
    }

    private createDisjunction(a: Predicate, b: Predicate): Predicate {
        if (a.kind === "false") return b;
        if (b.kind === "false") return a;
        if (a.kind === "true" || b.kind === "true") return TRUE_PREDICATE;
        return { kind: "or", left: a, right: b };
    }

    private createNegation(a: Predicate): Predicate {
        if (a.kind === "true") return FALSE_PREDICATE;
        if (a.kind === "false") return TRUE_PREDICATE;
        return { kind: "not", predicate: a };
    }

    private createImplication(a: Predicate, b: Predicate): Predicate {
        return this.createDisjunction(this.createNegation(a), b);
    }

    private rewriteExpression(
        expr: Expr,
        visitors: {
            var?: (name: string) => Expr | undefined;
            call?: (name: string, args: Expr[]) => Expr | undefined;
        }
    ): Expr {
        switch (expr.type) {
            case "num":
                return expr;

            case "var": {
                const replacement = visitors.var?.(expr.name);
                return replacement ?? expr;
            }

            case "neg":
                return { type: "neg", arg: this.rewriteExpression(expr.arg, visitors) } as Expr;

            case "bin":
                return {
                    type: "bin",
                    op: expr.op,
                    left: this.rewriteExpression(expr.left, visitors),
                    right: this.rewriteExpression(expr.right, visitors),
                } as Expr;

            case "arraccess":
                return {
                    type: "arraccess",
                    name: expr.name,
                    index: this.rewriteExpression(expr.index, visitors),
                };

            case "funccall": {
                const processedArgs = expr.args.map(arg => this.rewriteExpression(arg, visitors));
                const replacement = visitors.call?.(expr.name, processedArgs);
                return (
                    replacement ?? {
                        type: "funccall",
                        name: expr.name,
                        args: processedArgs,
                    }
                );
            }
        }
    }

    private rewritePredicate(
        pred: Predicate,
        boundVariables: Set<string>,
        mapExpression: (e: Expr, bound: Set<string>) => Expr
    ): Predicate {
        const keepMetadata = <T extends Predicate>(output: T): T => {
            copyMetadata(output, pred);
            return output;
        };

        switch (pred.kind) {
            case "true":
            case "false":
            case "formula":
                return pred;

            case "comparison":
                return keepMetadata({
                    kind: "comparison",
                    op: pred.op,
                    left: mapExpression(pred.left, boundVariables),
                    right: mapExpression(pred.right, boundVariables),
                });

            case "not":
                return keepMetadata({
                    kind: "not",
                    predicate: this.rewritePredicate(pred.predicate, boundVariables, mapExpression),
                });

            case "and":
            case "or":
                return keepMetadata({
                    kind: pred.kind,
                    left: this.rewritePredicate(pred.left, boundVariables, mapExpression),
                    right: this.rewritePredicate(pred.right, boundVariables, mapExpression),
                });

            case "paren": {
                const inner = this.rewritePredicate(pred.inner, boundVariables, mapExpression);
                copyMetadata(inner, pred);
                return inner;
            }

            case "quantifier": {
                const innerBound = new Set(boundVariables);
                innerBound.add(pred.varName);

                return keepMetadata({
                    kind: "quantifier",
                    quant: pred.quant,
                    varName: pred.varName,
                    varType: pred.varType,
                    body: this.rewritePredicate(pred.body, innerBound, mapExpression),
                });
            }
        }
    }

    private substituteExpression(expr: Expr, subs: Map<string, Expr>): Expr {
        return this.rewriteExpression(expr, { var: (name) => subs.get(name) });
    }

    private substitutePredicate(pred: Predicate, subs: Map<string, Expr>): Predicate {
        return this.rewritePredicate(pred, new Set(), (e, bound) =>
            this.rewriteExpression(e, {
                var: (name) => (bound.has(name) ? undefined : subs.get(name)),
            })
        );
    }

    private inlineFunctionCalls(expr: Expr): Expr {
        return this.rewriteExpression(expr, {
            call: (name, args) => {
                const spec = this.definitionalSpecs.get(name);
                if (!spec) return undefined;

                const subs = new Map<string, Expr>();
                for (let i = 0; i < spec.params.length; i++) {
                    subs.set(spec.params[i], args[i]);
                }
                return this.substituteExpression(spec.resultExpr, subs);
            },
        });
    }

    private generateScopedVarName(funcDef: AnnotatedFunctionDef, varName: string): string {
        return funcDef.name + "_" + varName;
    }

    private getExpressionKey(e: Expr): string {
        switch (e.type) {
            case "num":
                return `#${e.value}`;
            case "var":
                return `$${e.name}`;
            case "neg":
                return `(-${this.getExpressionKey(e.arg)})`;
            case "bin":
                return `(${this.getExpressionKey(e.left)}${e.op}${this.getExpressionKey(e.right)})`;
            case "arraccess":
                return `${e.name}[${this.getExpressionKey(e.index)}]`;
            case "funccall":
                return `${e.name}(${e.args.map(a => this.getExpressionKey(a)).join(",")})`;
        }
    }

    private resolveZ3Var(funcDef: AnnotatedFunctionDef, name: string, scope: Map<string, any>): any {
        return scope.get(name) ?? this.z3Context.Int.const(this.generateScopedVarName(funcDef, name));
    }

    private convertExpressionToZ3(funcDef: AnnotatedFunctionDef, expr: Expr, scope: Map<string, any> = new Map()): Arith {
        expr = this.inlineFunctionCalls(expr);
        switch (expr.type) {
            case "num":
                return this.z3Context.Int.val(expr.value);
            case "var":
                return this.resolveZ3Var(funcDef, expr.name, scope);
            case "neg":
                return this.z3Context.Int.val(0).sub(this.convertExpressionToZ3(funcDef, expr.arg, scope));
            case "bin": {
                const left = this.convertExpressionToZ3(funcDef, expr.left, scope);
                const right = this.convertExpressionToZ3(funcDef, expr.right, scope);
                switch (expr.op) {
                    case "+": return left.add(right);
                    case "-": return left.sub(right);
                    case "*": return left.mul(right);
                    case "/": return left.div(right);
                }
            }
            case "funccall": {
                const z3Func = this.getZ3FunctionDeclaration(expr.name, expr.args.length, "int");
                return z3Func.call(...expr.args.map(arg => this.convertExpressionToZ3(funcDef, arg, scope)));
            }
            case "arraccess": {
                const z3Array = this.z3Context.Array.const(this.generateScopedVarName(funcDef, expr.name), this.z3Context.Int.sort(), this.z3Context.Int.sort());
                const z3Index = this.convertExpressionToZ3(funcDef, expr.index, scope);
                return z3Array.select(z3Index);
            }
        }
    }

    private convertPredicateToZ3(funcDef: AnnotatedFunctionDef, pred: Predicate, scope: Map<string, any> = new Map()): Bool {
        switch (pred.kind) {
            case "true": return this.z3Context.Bool.val(true);
            case "false": return this.z3Context.Bool.val(false);
            case "comparison": {
                const left = this.convertExpressionToZ3(funcDef, pred.left, scope);
                const right = this.convertExpressionToZ3(funcDef, pred.right, scope);
                switch (pred.op) {
                    case "==": return left.eq(right);
                    case "!=": return this.z3Context.Not(left.eq(right));
                    case ">": return left.gt(right);
                    case "<": return left.lt(right);
                    case ">=": return left.ge(right);
                    case "<=": return left.le(right);
                }
            }
            case "not":
                return this.z3Context.Not(this.convertPredicateToZ3(funcDef, pred.predicate, scope));
            case "and":
                return this.z3Context.And(this.convertPredicateToZ3(funcDef, pred.left, scope), this.convertPredicateToZ3(funcDef, pred.right, scope));
            case "or":
                return this.z3Context.Or(this.convertPredicateToZ3(funcDef, pred.left, scope), this.convertPredicateToZ3(funcDef, pred.right, scope));
            case "paren":
                return this.convertPredicateToZ3(funcDef, pred.inner, scope);

            case "quantifier": {
                const z3Var = this.z3Context.Int.const(pred.varName);

                const newScope = new Map(scope);
                newScope.set(pred.varName, z3Var);

                const body = this.convertPredicateToZ3(funcDef, pred.body, newScope);

                if (pred.quant === "forall") {
                    return this.z3Context.ForAll([z3Var], body);
                } else {
                    return this.z3Context.Exists([z3Var], body);
                }
            }

            case "formula": {
                const z3Func = this.getZ3FunctionDeclaration(pred.name, pred.parameters.length, "bool");
                return z3Func.call(...pred.parameters.map(p => this.resolveZ3Var(funcDef, p.name, scope)));
            }
        }
    }

    private generateContractAxiomsForVC(verificationCondition: Predicate): Predicate[] {
        const seenCalls = new Set<string>();
        const axioms: Predicate[] = [];

        this.forEachCallInPredicate(verificationCondition, (callExpr) => {
            const key = this.getExpressionKey(callExpr);
            if (seenCalls.has(key)) return;
            seenCalls.add(key);

            const calleeDef = this.functionDefinitionMap.get(callExpr.name);
            if (!calleeDef?.post || calleeDef.returns.length !== 1) return;

            const pre = calleeDef.pre ?? TRUE_PREDICATE;
            const post = calleeDef.post;

            const subs = this.createSubstitutionMapForCall(calleeDef, callExpr);
            subs.set(calleeDef.returns[0].name, callExpr);

            const instantiatedPre = this.substitutePredicate(pre, subs);
            const instantiatedPost = this.substitutePredicate(post, subs);
            const guardedPost = this.guardCallPreconditions(instantiatedPost);

            axioms.push(this.createImplication(instantiatedPre, guardedPost));
        });

        return axioms;
    }

    private findViolationLocation(funcDef: AnnotatedFunctionDef, model: Model, pred: Predicate): SourceRange | undefined {
        let bestCandidate: { pos: SourceRange; span: number; depth: number } | undefined;

        const calculateSpan = (pos: SourceRange): number => {
            const startLine = pos.startLine ?? 0;
            const startCol = pos.startCol ?? 0;
            const endLine = pos.endLine ?? startLine;
            const endCol = pos.endCol ?? startCol;
            return Math.max(0, endLine - startLine) * 1_000_000 + Math.max(0, endCol - startCol);
        };

        const isFalseInModel = (p: Predicate): boolean => {
            try {
                const z3Predicate = this.convertPredicateToZ3(funcDef, p, new Map());
                const evaluationResult: any = model.eval(z3Predicate, true);
                return evaluationResult?.toString?.() === "false";
            } catch {
                return false;
            }
        };

        const visit = (p: Predicate, depth: number) => {
            const pos = getSourceLocation(p);
            if (pos && isFalseInModel(p)) {
                const span = calculateSpan(pos);
                if (!bestCandidate || span < bestCandidate.span || (span === bestCandidate.span && depth > bestCandidate.depth)) {
                    bestCandidate = { pos, span, depth };
                }
            }

            switch (p.kind) {
                case "not":
                    visit(p.predicate, depth + 1);
                    break;
                case "and":
                case "or":
                    visit(p.left, depth + 1);
                    visit(p.right, depth + 1);
                    break;
                case "paren":
                    visit(p.inner, depth + 1);
                    break;
                case "quantifier":
                    visit(p.body, depth + 1);
                    break;
            }
        };

        visit(pred, 0);
        return bestCandidate?.pos;
    }

    private async proveGoal(verificationCondition: Predicate, funcDef: AnnotatedFunctionDef): Promise<void> {
        const solver = new this.z3Context.Solver();
        const scope = new Map<string, any>();

        const guardedVC = this.guardCallPreconditions(verificationCondition);

        this.generateContractAxiomsForVC(guardedVC).forEach(axiom =>
            solver.add(this.convertPredicateToZ3(funcDef, axiom, scope))
        );

        solver.add(this.z3Context.Not(this.convertPredicateToZ3(funcDef, guardedVC, scope)));

        let result: string;
        try {
            result = await solver.check();
        } catch (e: any) {
            const msg = e instanceof Error ? e.message : String(e);
            fail(
                ErrorCode.VerificationError,
                `Z3 error while verifying function "${funcDef.name}": ${msg}`,
                getSourceLocation(verificationCondition)
            );
        }

        if (result === "unsat") return;

        if (result === "unknown") {
            fail(
                ErrorCode.VerificationError,
                `Z3 returned "unknown" while verifying function "${funcDef.name}".`,
                getSourceLocation(verificationCondition)
            );
        }

        const model: Model = solver.model();
        const msg = printFuncCall(this.z3Context, funcDef, model);

        const pos =
            this.findViolationLocation(funcDef, model, guardedVC) ??
            getSourceLocation(guardedVC) ??
            getSourceLocation(verificationCondition);

        console.log(pos)

        fail(
            ErrorCode.VerificationError,
            `Verification failed for function "${funcDef.name}".\n${msg}`,
            pos
        );
    }
}

export async function verifyModule(module: AnnotatedModule) {
    await initZ3();
    const verifier = new FunctionVerifier(z3, module);
    await verifier.verify();
}