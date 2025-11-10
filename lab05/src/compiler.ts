import { c as C, Op, I32 } from "@tvm/wasm";
import { Expr } from "@tvm/lab04";
import { buildOneFunctionModule, Fn } from "./emitHelper";
const { i32, get_local} = C;
    

export function visit(node:Expr, visitor: (ex:Expr)=>void) {
    switch (node.type) {
      case "num":
      case "var":
        visitor(node);
        return;
      case "neg":
        visitor(node.arg);
        visitor(node);
        return;
      case "bin":
        visitor(node.left);
        visitor(node.right);
        visitor(node)
        return;
    }
}
export function getVars2(e: Expr): string[] {
  const visited = new Set<string>();
  const variables: string[] = [];

  function traverse(node: Expr) {
    if(node.type === "var" && !visited.has(node.name)) {
      visited.add(node.name);
      variables.push(node.name);
    }
  }
  visit(e, traverse);
  return variables;
}

export function getVariables(e: Expr): string[] {
  const visited = new Set<string>();
  const variables: string[] = [];

  function traverse(node: Expr) {
    switch (node.type) {
      case "num":return;
      case "var":
        if (!visited.has(node.name)) {
          visited.add(node.name);
          variables.push(node.name);
        }
        return;
      case "neg":
        traverse(node.arg);
        return;
      case "bin":
        traverse(node.left);
        traverse(node.right);
        return;
    }
  }
  traverse(e);
  return variables;
}

export async function buildFunction(e: Expr, variables: string[]): Promise<Fn<number>>
{
  let expr = wasm(e, variables)
  return await buildOneFunctionModule("test", variables.length, [expr]);
}
const opMap = 
{
  "+": i32.add,
  "-": i32.sub,
  "/": i32.div_s,
  "*": i32.mul
};

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
      return opMap[e.op](leftOp, rightOp);
      // switch (e.op) {
      //   case "+": return i32.add(leftOp,  rightOp);
      //   case "-": return i32.sub(leftOp,  rightOp);
      //   case "*": return i32.mul(leftOp,  rightOp);
      //   case "/": return i32.div_s(leftOp, rightOp);
      // }
  }
}

