import { writeFileSync } from "fs";
import { Op, I32, Void, c, BufferedEmitter, LocalEntry, FuncType, VarUint32, ExportEntry, FunctionBody} from "../../wasm";
import { Condition, Expr, LValue, Module, Statement } from "../../lab08";

const { i32, varuint32, get_local, local_entry, set_local, call, if_, void_block, void_loop, br_if, str_ascii, export_entry,
        func_type_m, function_body, type_section, function_section, export_section, code_section, drop} = c;

function loadI32(addr: Op<I32>): Op<I32> {
  return c.i32.load(c.align32, addr);
}
function storeI32(addr: Op<I32>, value: Op<I32>): Op<Void> {
  return c.i32.store(c.align32, addr, value);
}
function scaleIndex(idx: Op<I32>): Op<I32> {
  return i32.mul(idx, i32.const(4));
}
function offsetIndex(scaled: Op<I32>): Op<I32> {
  return i32.add(i32.const(4), scaled);
}

function compileArrayAddress(name: string, indexExpr: Expr, ctx: CompileContext): Op<I32> {
  const baseIndex = getLocalIndex(ctx.locals, name);
  const base = get_local(i32, baseIndex);
  const idx = compileExpr(indexExpr, ctx);
  const scaled = scaleIndex(idx);
  const offset = offsetIndex(scaled);
  return i32.add(base, offset);
}

type LocalEnv = Map<string, number>;
type FunIndexMap = Map<string, number>;
type FunReturnCountMap = Map<string, number>;

interface CompileContext {
  locals: LocalEnv;
  functionIndexMap: FunIndexMap;
  functionReturnCounts: FunReturnCountMap;
  tempStart: number;
  tempCount: number;
}

type CompiledLValue = {
  set(value: Op<I32>): Op<Void>;
  get(): Op<I32>;
};


export async function compileModule<M extends Module>(m: M, name?: string): Promise<WebAssembly.Exports> {
  const typeSectionEntries: FuncType[] = [];
  const functionSectionEntries: VarUint32[] = [];
  const exportSectionEntries: ExportEntry[] = [];
  const codeSectionEntries: FunctionBody[] = [];

  const functionIndexMap: FunIndexMap = new Map();
  const functionReturnCounts: FunReturnCountMap = new Map();

  // Phase 1: collect signatures and exports
  for (let i = 0; i < m.functions.length; i++) {
    const func = m.functions[i];
    functionIndexMap.set(func.name, i);
    functionReturnCounts.set(func.name, func.returns.length);

    const paramTypes = func.parameters.map(() => i32);
    const returnTypes = func.returns.map(() => i32);

    typeSectionEntries.push(func_type_m(paramTypes, returnTypes));
    functionSectionEntries.push(varuint32(i));
    exportSectionEntries.push(
      export_entry(str_ascii(func.name), c.external_kind.function, varuint32(i))
    );
  }

  // single memory, always exported
  const memoryLimits = c.resizable_limits(varuint32(1));
  const memorySection = c.memory_section([memoryLimits]);
  exportSectionEntries.push(
    export_entry(str_ascii("memory"), c.external_kind.memory, varuint32(0))
  );

  // Phase 2: generate function bodies
  for (let i = 0; i < m.functions.length; i++) {
    const func = m.functions[i];

    const paramCount = func.parameters.length;
    const returnNames = func.returns.map(r => r.name);
    const localNames = func.locals.map(l => l.name);
    const maxTupleSize = computeMaxTupleSize(func.body);

    // Build local environment: params | returns | locals | temps
    const localEnv: LocalEnv = new Map();
    func.parameters.forEach((p, idx) => localEnv.set(p.name, idx));
    // returns and locals and temps get indices after parameters
    const returnStart = paramCount;
    returnNames.forEach((n, idx) => localEnv.set(n, returnStart + idx));
    const localsStart = returnStart + returnNames.length;
    localNames.forEach((n, idx) => localEnv.set(n, localsStart + idx));
    const tempsStart = localsStart + localNames.length;
    Array.from({ length: maxTupleSize }, (_, idx) => `$t${idx}`)
      .forEach((n, idx) => localEnv.set(n, tempsStart + idx));

    // LocalEntry groups: returns, user locals, temps
    const localEntries: LocalEntry[] = [];
    if (returnNames.length > 0)   localEntries.push(local_entry(varuint32(returnNames.length), i32));
    if (localNames.length  > 0)  localEntries.push(local_entry(varuint32(localNames.length), i32));
    if (maxTupleSize     > 0)  localEntries.push(local_entry(varuint32(maxTupleSize), i32));

    const ctx: CompileContext = {
      locals: localEnv,
      functionIndexMap,
      functionReturnCounts,
      tempStart: tempsStart,
      tempCount: maxTupleSize,
    };

    // compile body statements
    const bodyOps: (Op<Void> | Op<I32>)[] = compileStatement(func.body, ctx);

    // at end, push all return values onto stack
    for (const r of func.returns) {
      const idxLocal = getLocalIndex(localEnv, r.name);
      bodyOps.push(get_local(i32, idxLocal));
    }

    codeSectionEntries.push(function_body(localEntries, bodyOps));
  }

  // assemble module
  const mod = c.module([
    type_section(typeSectionEntries),
    function_section(functionSectionEntries),
    memorySection,
    export_section(exportSectionEntries),
    code_section(codeSectionEntries),
  ]);

  const emitter = new BufferedEmitter(new ArrayBuffer(mod.z));
  mod.emit(emitter);
  const wasmModule = await WebAssembly.instantiate(emitter.buffer);
  return wasmModule.instance.exports;
}

function getLocalIndex(env: LocalEnv, name: string): number {
  const idx = env.get(name);
  if (idx === undefined) {
    throw new WebAssembly.RuntimeError(`Unknown variable: ${name}`);
  }
  return idx;
}

function computeMaxTupleSize(stmt: Statement): number {
  let maxSize = 0;
  function visit(s: Statement): void {
      switch (s.type) {
        case "assign":
          if (s.targets.length > maxSize) maxSize = s.targets.length;
          break;
        case "block":
          s.stmts.forEach(visit);
          break;
        case "if":
          visit(s.then);
          if (s.else) visit(s.else);
          break;
        case "while":
          visit(s.body);
          break;
        case "expr":
          break;
      }
  }
  visit(stmt);
  return maxSize;
}

function compileExpr(expr: Expr, ctx: CompileContext): Op<I32> {
  switch (expr.type) {
    case "num":
      return i32.const(expr.value);
    case "var": {
      const idx = getLocalIndex(ctx.locals, expr.name);
      return get_local(i32, idx);
    }
    case "neg":
      return i32.sub(i32.const(0), compileExpr(expr.arg, ctx));
    case "bin": {
      const l = compileExpr(expr.left, ctx);
      const r = compileExpr(expr.right, ctx);
      switch (expr.op) {
        case "+": return i32.add(l, r);
        case "-": return i32.sub(l, r);
        case "*": return i32.mul(l, r);
        case "/": return i32.div_s(l, r);
      }
    }
    case "funccall":
      if (expr.name === "length") {
        if (expr.args.length !== 1) {
          throw new WebAssembly.RuntimeError(`length expects 1 argument, got ${expr.args.length}`);
        }
        const arrPtr = compileExpr(expr.args[0], ctx);
        return loadI32(arrPtr);
      }
      const args = expr.args.map(a => compileExpr(a, ctx));
      const fi = ctx.functionIndexMap.get(expr.name);
      if (fi === undefined) {
        throw new WebAssembly.RuntimeError(`Unknown function: ${expr.name}`);
      }
      return call(i32, varuint32(fi), args);
    case "arraccess": {
      const addr = compileArrayAddress(expr.name, expr.index, ctx);
      return loadI32(addr);
    }
  }
}

function compileLValue(lvalue: LValue, ctx: CompileContext): CompiledLValue {
  switch (lvalue.type) {
    case "lvar": {
      const idx = getLocalIndex(ctx.locals, lvalue.name);
      return {
        set: (v) => set_local(idx, v),
        get: () => get_local(i32, idx),
      };
    }
    case "larr": {
      return {
        set: (v) => {
          const addr = compileArrayAddress(lvalue.name, lvalue.index, ctx);
          return storeI32(addr, v);
        },
        get: () => {
          const addr = compileArrayAddress(lvalue.name, lvalue.index, ctx);
          return loadI32(addr);
        },
      };
    }
  }
}

function getExpressionValueCount(expr: Expr, ctx: CompileContext): number {
  if (expr.type === "funccall" && expr.name !== "length") {
    const ctn = ctx.functionReturnCounts.get(expr.name);
    if (ctn !== undefined) return ctn;
  }
  return 1;
}

function compileCondition(cond: Condition, ctx: CompileContext): Op<I32> {
  switch (cond.kind) {
    case "true":  return i32.const(1);
    case "false": return i32.const(0);
    case "comparison": {
      const l = compileExpr(cond.left, ctx);
      const r = compileExpr(cond.right, ctx);
      switch (cond.op) {
        case "==": return i32.eq(l, r);
        case "!=": return i32.ne(l, r);
        case ">":  return i32.gt_s(l, r);
        case "<":  return i32.lt_s(l, r);
        case ">=": return i32.ge_s(l, r);
        case "<=": return i32.le_s(l, r);
      }
    }
    case "not":   return i32.eqz(compileCondition(cond.condition, ctx));
    case "and":
      return if_(
        i32,
        compileCondition(cond.left, ctx),
        [ compileCondition(cond.right, ctx) ],
        [ i32.const(0) ]
      );
    case "or":
      return if_(
        i32,
        compileCondition(cond.left, ctx),
        [ i32.const(1) ],
        [ compileCondition(cond.right, ctx) ]
      );
    case "implies":
      return if_(
        i32,
        compileCondition(cond.left, ctx),
        [ compileCondition(cond.right, ctx) ],
        [ i32.const(1) ]
      );
    case "paren":
      return compileCondition(cond.inner, ctx);
  }
}

function compileAssignment(stmt: Statement & { type: "assign" }, ctx: CompileContext): Op<Void>[] {
  const ops: Op<Void>[] = [];
  // simple case
  if (stmt.targets.length === 1
    && stmt.exprs.length === 1
    && getExpressionValueCount(stmt.exprs[0], ctx) === 1
  ) {
    const val = compileExpr(stmt.exprs[0], ctx);
    const lval = compileLValue(stmt.targets[0], ctx);
    ops.push(lval.set(val));
    return ops;
  }
  // tuple assignment
  const total = stmt.targets.length;
  if (total > ctx.tempCount) {
    throw new Error("Not enough temporaries allocated for tuple assignment.");
  }
  let offset = 0;
  // store all values in temps
  stmt.exprs.forEach(expr => {
    const cnt = getExpressionValueCount(expr, ctx);
    const tempIdx = ctx.tempStart + offset;
    const val = compileExpr(expr, ctx);
    ops.push(set_local(tempIdx, val));
    offset += cnt;
  });
  // distribute temps to targets
  for (let i = 0; i < total; i++) {
    const lval = compileLValue(stmt.targets[i], ctx);
    const tempVal = get_local(i32, ctx.tempStart + i);
    ops.push(lval.set(tempVal));
  }
  return ops;
}

function compileStatement(stmt: Statement, ctx: CompileContext): Op<Void>[] {
  const ops: Op<Void>[] = [];
  switch (stmt.type) {
    case "block":
      stmt.stmts.forEach(s => ops.push(...compileStatement(s, ctx)));
      break;
    case "assign":
      ops.push(...compileAssignment(stmt, ctx));
      break;
    case "if": {
      const condOp = compileCondition(stmt.condition, ctx);
      const thenOps = compileStatement(stmt.then, ctx);
      const elseOps = stmt.else ? compileStatement(stmt.else, ctx) : [];
      ops.push(void_block([ if_(c.void, condOp, thenOps, elseOps) ]));
      break;
    }
    case "while": {
      const body = compileStatement(stmt.body, ctx);
      ops.push(void_block([
        void_loop([
          br_if(1, i32.eqz(compileCondition(stmt.condition, ctx))),
          ...body,
          c.br(0),
        ]),
      ]));
      break;
    }
    case "expr": {
      const exprOp = compileExpr(stmt.expr, ctx);
      ops.push(drop(c.void, exprOp));
      break;
    }
  }
  return ops;
}

export { FunnyError } from '../../lab08'