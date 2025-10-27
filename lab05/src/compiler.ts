import { c as C, Op, I32 } from "../../wasm";
import { Expr } from "../../lab04";
import { buildOneFunctionModule, Fn } from "./emitHelper";
const { i32, get_local} = C;
    
function traverse(node: Expr, vi: Set<String>, vars: string[]) {
  switch (node.type) {
    case "num":return;
    case "var":
      if (!vi.has(node.name)) {
        vi.add(node.name);
        vars.push(node.name);
      }
      return;
    case "neg":
      traverse(node.arg, vi, vars);
      return;
    case "bin":
      traverse(node.left, vi, vars);
      traverse(node.right, vi, vars);
      return;
  }
}

export function getVariables(e: Expr): string[] {
  const visited = new Set<string>();
  const variables: string[] = [];

  traverse(e, visited, variables);
  return variables;
}

export async function buildFunction(e: Expr, variables: string[]): Promise<Fn<number>>
{
  let expr = wasm(e, variables)
  return await buildOneFunctionModule("test", variables.length, [expr]);
}

function wasm(e: Expr, args: string[]): Op<I32> {
  switch (e.type) {
    case "num":
      return i32.const(e.value);
    case "var":
      const idx = args.indexOf(e.name);
      if (idx < 0) {
        throw new Error(`Unknown variable ${e.name}`);
      }
      return get_local(i32, idx);
    case "neg":
      return i32.sub(i32.const(0), wasm(e.arg, args));
    case "bin":
      const leftOp  = wasm(e.left,  args);
      const rightOp = wasm(e.right, args);
      switch (e.op) {
        case "+": return i32.add(leftOp,  rightOp);
        case "-": return i32.sub(leftOp,  rightOp);
        case "*": return i32.mul(leftOp,  rightOp);
        case "/": return i32.div_s(leftOp, rightOp);
      }
  }
}
