import { getExprAst, printExpr } from "lab04";
import { getVariables, compileAndExecute } from "lab05";
import { derive } from "./derive";

export function deriveAndPrint(source: string, varName: string): string
{
    let expr = getExprAst(source);
    let derivative = derive(expr, varName);
    return printExpr(derivative);
}

export async function deriveAndCalculate(source: string, varName: string, ...args:number[]): Promise<number>
{
    let expr = getExprAst(source);
    // we will use the original variable list to isolate the user from the 
    // case when some variable(s) disappear after derivation
    // e.g. x + x*y + z |'x yields (1 + y), leaving only one variable.
    let variables = getVariables(expr); 
    let derivative = derive(expr, varName);
    return await compileAndExecute(derivative, variables, ...args);
}