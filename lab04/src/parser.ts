import { MatchResult } from 'ohm-js';
import { arithGrammar, ArithmeticActionDict, ArithmeticSemantics, SyntaxError } from '@tvm/lab03';
import { Expr } from './ast';

export const getArithAst: ArithmeticActionDict<Expr> = {
    // write rules here
}

export const semantics = arithGrammar.createSemantics();
semantics.addOperation("parse()", getArithAst);

export interface ArithSemanticsExt extends ArithmeticSemantics
{
    (match: MatchResult): ArithActionsExt
}

export interface ArithActionsExt 
{
    parse(): Expr
}
export function parseExpr(source: string): Expr
{
    throw "Not implemented"
}


    
