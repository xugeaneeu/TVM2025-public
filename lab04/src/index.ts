import { parseExpr } from "./parser";
import { printExpr } from "./printExpr";

export { printExpr, parseExpr };
export { Expr } from "./ast";

export const parseAndPrint = (source: string): string => printExpr(parseExpr(source));