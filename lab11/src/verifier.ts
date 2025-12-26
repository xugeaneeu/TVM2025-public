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

type VerifierContext = {
    z3Context: Context;
    module: AnnotatedModule;
    functionDefinitionMap: Map<string, AnnotatedFunctionDef>;
    definitionalSpecs: Map<string, DefinitionalSpec>;
    z3FunctionCache: Map<string, any>;
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

// --- Predicate / Expr Creation Helpers ---

function createConjunction(a: Predicate, b: Predicate): Predicate {
    if (a.kind === "true") return b;
    if (b.kind === "true") return a;
    if (a.kind === "false" || b.kind === "false") return FALSE_PREDICATE;
    return { kind: "and", left: a, right: b };
}

function createDisjunction(a: Predicate, b: Predicate): Predicate {
    if (a.kind === "false") return b;
    if (b.kind === "false") return a;
    if (a.kind === "true" || b.kind === "true") return TRUE_PREDICATE;
    return { kind: "or", left: a, right: b };
}

function createNegation(a: Predicate): Predicate {
    if (a.kind === "true") return FALSE_PREDICATE;
    if (a.kind === "false") return TRUE_PREDICATE;
    return { kind: "not", predicate: a };
}

function createImplication(a: Predicate, b: Predicate): Predicate {
    return createDisjunction(createNegation(a), b);
}

// --- Rewriting and Substitution ---

function rewriteExpression(
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
            return { type: "neg", arg: rewriteExpression(expr.arg, visitors) } as Expr;

        case "bin":
            return {
                type: "bin",
                op: expr.op,
                left: rewriteExpression(expr.left, visitors),
                right: rewriteExpression(expr.right, visitors),
            } as Expr;

        case "arraccess":
            return {
                type: "arraccess",
                name: expr.name,
                index: rewriteExpression(expr.index, visitors),
            };

        case "funccall": {
            const processedArgs = expr.args.map(arg => rewriteExpression(arg, visitors));
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

function rewritePredicate(
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
                predicate: rewritePredicate(pred.predicate, boundVariables, mapExpression),
            });

        case "and":
        case "or":
            return keepMetadata({
                kind: pred.kind,
                left: rewritePredicate(pred.left, boundVariables, mapExpression),
                right: rewritePredicate(pred.right, boundVariables, mapExpression),
            });

        case "paren": {
            const inner = rewritePredicate(pred.inner, boundVariables, mapExpression);
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
                body: rewritePredicate(pred.body, innerBound, mapExpression),
            });
        }
    }
}

function substituteExpression(expr: Expr, subs: Map<string, Expr>): Expr {
    return rewriteExpression(expr, { var: (name) => subs.get(name) });
}

function substitutePredicate(pred: Predicate, subs: Map<string, Expr>): Predicate {
    return rewritePredicate(pred, new Set(), (e, bound) =>
        rewriteExpression(e, {
            var: (name) => (bound.has(name) ? undefined : subs.get(name)),
        })
    );
}

function inlineFunctionCalls(ctx: VerifierContext, expr: Expr): Expr {
    return rewriteExpression(expr, {
        call: (name, args) => {
            const spec = ctx.definitionalSpecs.get(name);
            if (!spec) return undefined;

            const subs = new Map<string, Expr>();
            for (let i = 0; i < spec.params.length; i++) {
                subs.set(spec.params[i], args[i]);
            }
            return substituteExpression(spec.resultExpr, subs);
        },
    });
}

// --- Traversals and Precondition Guarding ---

function forEachCallInExpression(expr: Expr, visitor: (call: FunctionCallExpression) => void): void {
    if (expr.type === "funccall") visitor(expr);

    const children: Expr[] =
        expr.type === "funccall" ? expr.args :
            expr.type === "bin" ? [expr.left, expr.right] :
                expr.type === "neg" ? [expr.arg] :
                    expr.type === "arraccess" ? [expr.index] :
                        [];

    children.forEach(child => forEachCallInExpression(child, visitor));
}

function forEachCallInPredicate(pred: Predicate, visitor: (call: FunctionCallExpression) => void): void {
    if (pred.kind === "comparison") {
        forEachCallInExpression(pred.left, visitor);
        forEachCallInExpression(pred.right, visitor);
        return;
    }

    const children: Predicate[] =
        pred.kind === "and" || pred.kind === "or" ? [pred.left, pred.right] :
            pred.kind === "not" ? [pred.predicate] :
                pred.kind === "paren" ? [pred.inner] :
                    pred.kind === "quantifier" ? [pred.body] :
                        [];

    children.forEach(child => forEachCallInPredicate(child, visitor));
}

function createSubstitutionMapForCall(calleeDef: AnnotatedFunctionDef, callExpr: FunctionCallExpression): Map<string, Expr> {
    return new Map(calleeDef.parameters.map((param, index) => [param.name, callExpr.args[index]] as const));
}

function guardCallPreconditions(ctx: VerifierContext, pred: Predicate): Predicate {
    const keepMetadata = <T extends Predicate>(output: T): T => {
        copyMetadata(output, pred);
        return output;
    };

    switch (pred.kind) {
        case "comparison": {
            let guardedPredicate: Predicate = pred;

            const wrapWithPrecondition = (callExpr: FunctionCallExpression) => {
                const calleeDef = ctx.functionDefinitionMap.get(callExpr.name);
                const calleePre = calleeDef?.pre ?? TRUE_PREDICATE;
                const subs = createSubstitutionMapForCall(calleeDef!, callExpr);
                const substitutedPre = substitutePredicate(calleePre, subs);
                guardedPredicate = createConjunction(substitutedPre, guardedPredicate);
            };

            forEachCallInExpression(pred.left, wrapWithPrecondition);
            forEachCallInExpression(pred.right, wrapWithPrecondition);

            copyMetadata(guardedPredicate, pred);
            return guardedPredicate;
        }

        case "and":
        case "or":
            return keepMetadata({
                kind: pred.kind,
                left: guardCallPreconditions(ctx, pred.left),
                right: guardCallPreconditions(ctx, pred.right),
            });

        case "not":
            return keepMetadata({
                kind: "not",
                predicate: guardCallPreconditions(ctx, pred.predicate),
            });

        case "paren": {
            const inner = guardCallPreconditions(ctx, pred.inner);
            copyMetadata(inner, pred);
            return inner;
        }

        case "quantifier":
            return {
                ...(pred),
                body: guardCallPreconditions(ctx, pred.body),
            } as Predicate;

        default:
            return pred;
    }
}

// --- WP Calculation ---

function convertConditionToPredicate(cond: Condition): Predicate {
    switch (cond.kind) {
        case "implies":
            return createImplication(convertConditionToPredicate(cond.left), convertConditionToPredicate(cond.right));
        case "not":
            return createNegation(convertConditionToPredicate(cond.condition));
        case "and":
            return createConjunction(convertConditionToPredicate(cond.left), convertConditionToPredicate(cond.right));
        case "or":
            return createDisjunction(convertConditionToPredicate(cond.left), convertConditionToPredicate(cond.right));
        case "paren":
            return convertConditionToPredicate(cond.inner);
        default:
            return cond as Predicate;
    }
}

function createSubstitutionMapFromAssignment(stmt: AssignmentStatement): Map<string, Expr> {
    return new Map(
        stmt.targets.flatMap((target, index) => (target.type === "lvar" ? [[target.name, stmt.exprs[index]] as const] : []))
    );
}

function computeWeakestPrecondition(
    ctx: VerifierContext,
    funcDef: AnnotatedFunctionDef,
    stmt: Statement,
    postCondition: Predicate
): { pre: Predicate; vcs: Predicate[] } {
    switch (stmt.type) {
        case "expr":
            return { pre: postCondition, vcs: [] };

        case "assign": {
            const subs = createSubstitutionMapFromAssignment(stmt);
            return { pre: substitutePredicate(postCondition, subs), vcs: [] };
        }

        case "block": {
            let currentPostCondition = postCondition;
            let accumulatedVCs: Predicate[] = [];

            for (let i = stmt.stmts.length - 1; i >= 0; i--) {
                const statement = stmt.stmts[i];

                const result = computeWeakestPrecondition(ctx, funcDef, statement, currentPostCondition);
                currentPostCondition = result.pre;

                if (statement.type === "assign") {
                    const subs = createSubstitutionMapFromAssignment(statement);
                    if (subs.size) {
                        accumulatedVCs = accumulatedVCs.map(vc => substitutePredicate(vc, subs));
                    }
                }

                accumulatedVCs.push(...result.vcs);
            }

            return { pre: currentPostCondition, vcs: accumulatedVCs };
        }

        case "if": {
            const conditionPredicate = convertConditionToPredicate(stmt.condition);
            const thenResult = computeWeakestPrecondition(ctx, funcDef, stmt.then, postCondition);
            const elseResult = stmt.else
                ? computeWeakestPrecondition(ctx, funcDef, stmt.else, postCondition)
                : { pre: postCondition, vcs: [] };

            const thenPre = thenResult.pre;
            const elsePre = elseResult.pre;

            const pre = createConjunction(
                createImplication(conditionPredicate, thenPre),
                createImplication(createNegation(conditionPredicate), elsePre)
            );

            return { pre, vcs: [...thenResult.vcs, ...elseResult.vcs] };
        }

        case "while": {
            const invariant = stmt.invariant ?? TRUE_PREDICATE;
            const conditionPredicate = convertConditionToPredicate(stmt.condition);

            // 1. Invariant is preserved by the body: (Inv && Cond) => WP(Body, Inv)
            const bodyResultInvariant = computeWeakestPrecondition(ctx, funcDef, stmt.body, invariant);
            const vcPreserveInvariant = createImplication(
                createConjunction(invariant, conditionPredicate),
                bodyResultInvariant.pre
            );

            // 2. Loop exit logic
            // Post-condition after loop body executes one more time and exits: Inv && (!Cond => Post)
            const postAfterBody = createConjunction(
                invariant,
                createImplication(createNegation(conditionPredicate), postCondition)
            );

            const bodyResultExit = computeWeakestPrecondition(ctx, funcDef, stmt.body, postAfterBody);
            const vcOneStepExit = createImplication(
                createConjunction(invariant, conditionPredicate),
                bodyResultExit.pre
            );

            // 3. Exit condition: (Inv && !Cond) => Post
            const vcLoopExit = createImplication(
                createConjunction(invariant, createNegation(conditionPredicate)),
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

// --- Z3 Conversion and Solver Logic ---

function getZ3FunctionDeclaration(ctx: VerifierContext, name: string, arity: number, returnType: "int" | "bool") {
    const cacheKey = `${name}/${arity}/${returnType}`;
    if (!ctx.z3FunctionCache.has(cacheKey)) {
        const domainSorts = Array.from({ length: arity }, () => ctx.z3Context.Int.sort());
        const rangeSort = returnType === "int" ? ctx.z3Context.Int.sort() : ctx.z3Context.Bool.sort();
        const decl = ctx.z3Context.Function.declare(name, ...domainSorts, rangeSort);
        ctx.z3FunctionCache.set(cacheKey, decl);
    }
    return ctx.z3FunctionCache.get(cacheKey);
}

function generateScopedVarName(funcDef: AnnotatedFunctionDef, varName: string): string {
    return funcDef.name + "_" + varName;
}

function resolveZ3Var(ctx: VerifierContext, funcDef: AnnotatedFunctionDef, name: string, scope: Map<string, any>): any {
    return scope.get(name) ?? ctx.z3Context.Int.const(generateScopedVarName(funcDef, name));
}

function convertExpressionToZ3(
    ctx: VerifierContext,
    funcDef: AnnotatedFunctionDef,
    expr: Expr,
    scope: Map<string, any> = new Map()
): Arith {
    expr = inlineFunctionCalls(ctx, expr);
    switch (expr.type) {
        case "num":
            return ctx.z3Context.Int.val(expr.value);
        case "var":
            return resolveZ3Var(ctx, funcDef, expr.name, scope);
        case "neg":
            return ctx.z3Context.Int.val(0).sub(convertExpressionToZ3(ctx, funcDef, expr.arg, scope));
        case "bin": {
            const left = convertExpressionToZ3(ctx, funcDef, expr.left, scope);
            const right = convertExpressionToZ3(ctx, funcDef, expr.right, scope);
            switch (expr.op) {
                case "+": return left.add(right);
                case "-": return left.sub(right);
                case "*": return left.mul(right);
                case "/": return left.div(right);
            }
        }
        case "funccall": {
            const z3Func = getZ3FunctionDeclaration(ctx, expr.name, expr.args.length, "int");
            return z3Func.call(...expr.args.map(arg => convertExpressionToZ3(ctx, funcDef, arg, scope)));
        }
        case "arraccess": {
            const z3Array = ctx.z3Context.Array.const(generateScopedVarName(funcDef, expr.name), ctx.z3Context.Int.sort(), ctx.z3Context.Int.sort());
            const z3Index = convertExpressionToZ3(ctx, funcDef, expr.index, scope);
            return z3Array.select(z3Index);
        }
    }
}

function convertPredicateToZ3(
    ctx: VerifierContext,
    funcDef: AnnotatedFunctionDef,
    pred: Predicate,
    scope: Map<string, any> = new Map()
): Bool {
    switch (pred.kind) {
        case "true": return ctx.z3Context.Bool.val(true);
        case "false": return ctx.z3Context.Bool.val(false);
        case "comparison": {
            const left = convertExpressionToZ3(ctx, funcDef, pred.left, scope);
            const right = convertExpressionToZ3(ctx, funcDef, pred.right, scope);
            switch (pred.op) {
                case "==": return left.eq(right);
                case "!=": return ctx.z3Context.Not(left.eq(right));
                case ">": return left.gt(right);
                case "<": return left.lt(right);
                case ">=": return left.ge(right);
                case "<=": return left.le(right);
            }
        }
        case "not":
            return ctx.z3Context.Not(convertPredicateToZ3(ctx, funcDef, pred.predicate, scope));
        case "and":
            return ctx.z3Context.And(convertPredicateToZ3(ctx, funcDef, pred.left, scope), convertPredicateToZ3(ctx, funcDef, pred.right, scope));
        case "or":
            return ctx.z3Context.Or(convertPredicateToZ3(ctx, funcDef, pred.left, scope), convertPredicateToZ3(ctx, funcDef, pred.right, scope));
        case "paren":
            return convertPredicateToZ3(ctx, funcDef, pred.inner, scope);

        case "quantifier": {
            const z3Var = ctx.z3Context.Int.const(pred.varName);

            const newScope = new Map(scope);
            newScope.set(pred.varName, z3Var);

            const body = convertPredicateToZ3(ctx, funcDef, pred.body, newScope);

            if (pred.quant === "forall") {
                return ctx.z3Context.ForAll([z3Var], body);
            } else {
                return ctx.z3Context.Exists([z3Var], body);
            }
        }

        case "formula": {
            const z3Func = getZ3FunctionDeclaration(ctx, pred.name, pred.parameters.length, "bool");
            return z3Func.call(...pred.parameters.map(p => resolveZ3Var(ctx, funcDef, p.name, scope)));
        }
    }
}

function getExpressionKey(e: Expr): string {
    switch (e.type) {
        case "num":
            return `#${e.value}`;
        case "var":
            return `$${e.name}`;
        case "neg":
            return `(-${getExpressionKey(e.arg)})`;
        case "bin":
            return `(${getExpressionKey(e.left)}${e.op}${getExpressionKey(e.right)})`;
        case "arraccess":
            return `${e.name}[${getExpressionKey(e.index)}]`;
        case "funccall":
            return `${e.name}(${e.args.map(a => getExpressionKey(a)).join(",")})`;
    }
}

function generateContractAxiomsForVC(ctx: VerifierContext, verificationCondition: Predicate): Predicate[] {
    const seenCalls = new Set<string>();
    const axioms: Predicate[] = [];

    forEachCallInPredicate(verificationCondition, (callExpr) => {
        const key = getExpressionKey(callExpr);
        if (seenCalls.has(key)) return;
        seenCalls.add(key);

        const calleeDef = ctx.functionDefinitionMap.get(callExpr.name);
        if (!calleeDef?.post || calleeDef.returns.length !== 1) return;

        const pre = calleeDef.pre ?? TRUE_PREDICATE;
        const post = calleeDef.post;

        const subs = createSubstitutionMapForCall(calleeDef, callExpr);
        subs.set(calleeDef.returns[0].name, callExpr);

        const instantiatedPre = substitutePredicate(pre, subs);
        const instantiatedPost = substitutePredicate(post, subs);
        const guardedPost = guardCallPreconditions(ctx, instantiatedPost);

        axioms.push(createImplication(instantiatedPre, guardedPost));
    });

    return axioms;
}

function findViolationLocation(ctx: VerifierContext, funcDef: AnnotatedFunctionDef, model: Model, pred: Predicate): SourceRange | undefined {
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
            const z3Predicate = convertPredicateToZ3(ctx, funcDef, p, new Map());
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

async function proveGoal(ctx: VerifierContext, verificationCondition: Predicate, funcDef: AnnotatedFunctionDef): Promise<void> {
    const solver = new ctx.z3Context.Solver();
    const scope = new Map<string, any>();

    const guardedVC = guardCallPreconditions(ctx, verificationCondition);

    generateContractAxiomsForVC(ctx, guardedVC).forEach(axiom =>
        solver.add(convertPredicateToZ3(ctx, funcDef, axiom, scope))
    );

    solver.add(ctx.z3Context.Not(convertPredicateToZ3(ctx, funcDef, guardedVC, scope)));

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
    const msg = printFuncCall(ctx.z3Context, funcDef, model);

    const pos =
        findViolationLocation(ctx, funcDef, model, guardedVC) ??
        getSourceLocation(guardedVC) ??
        getSourceLocation(verificationCondition);

    console.log(pos)

    fail(
        ErrorCode.VerificationError,
        `Verification failed for function "${funcDef.name}".\n${msg}`,
        pos
    );
}

// --- Setup and Spec Extraction ---

function extractDefinitionalSpec(retParam: ParameterDef, postCondition: Predicate, params: ParameterDef[]) {
    let currentPredicate = postCondition;
    while (currentPredicate.kind === "paren") currentPredicate = currentPredicate.inner;

    if (currentPredicate.kind !== "comparison" || currentPredicate.op !== "==") return;

    const isReturnVar = (e: Expr) => e.type === "var" && e.name === retParam.name;
    const paramNames = params.map(p => p.name);

    if (isReturnVar(currentPredicate.left)) return { params: paramNames, resultExpr: currentPredicate.right };
    if (isReturnVar(currentPredicate.right)) return { params: paramNames, resultExpr: currentPredicate.left };
}

function buildDefinitionalSpecs(module: AnnotatedModule): Map<string, DefinitionalSpec> {
    return new Map(
        module.functions.flatMap(funcDef => {
            if (funcDef.returns.length !== 1 || !funcDef.post) return [];
            const spec = extractDefinitionalSpec(funcDef.returns[0], funcDef.post, funcDef.parameters);
            return spec ? [[funcDef.name, spec] as const] : [];
        })
    );
}

// --- Main Verification Loop ---

async function verifyFunction(ctx: VerifierContext, funcDef: AnnotatedFunctionDef): Promise<void> {
    const postCondition = funcDef.post ?? TRUE_PREDICATE;
    const preCondition = funcDef.pre ?? TRUE_PREDICATE;

    const postLocation = getSourceLocation(postCondition);

    const { pre: calculatedPre, vcs: verificationConditions } = computeWeakestPrecondition(ctx, funcDef, funcDef.body, postCondition);

    const allConditions = [calculatedPre, ...verificationConditions];

    for (const condition of allConditions) {
        const goal = createImplication(preCondition, condition);
        attachBlame(goal, getSourceLocation(condition) ?? postLocation);
        await proveGoal(ctx, goal, funcDef);
    }
}

export async function verifyModule(module: AnnotatedModule) {
    await initZ3();
    
    const context: VerifierContext = {
        z3Context: z3,
        module: module,
        functionDefinitionMap: new Map(module.functions.map(f => [f.name, f])),
        definitionalSpecs: buildDefinitionalSpecs(module),
        z3FunctionCache: new Map(),
    };

    for (const funcDef of module.functions) {
        await verifyFunction(context, funcDef);
    }
}