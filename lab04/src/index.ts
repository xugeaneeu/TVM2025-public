import { getExprAst } from "./ast";
import { printExpr } from "./printExpr";

export { printExpr, getExprAst };
export { Expr } from "./ast";

export const parseAndPrint = (source: string): string => printExpr(getExprAst(source));