import { MatchResult } from 'ohm-js';
import { arithGrammar, ArithmeticActionDict, ArithmeticSemantics, SyntaxError } from '@tvm/lab03';

export const getArithAst: ArithmeticActionDict<Expr> = {

}

//export const semantics: ArithSemanticsExt = arithGrammar.createSemantics() as ArithSemanticsExt;
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
export function getExprAst(source: string): Expr
{
    throw "Not implemented"
}

export type Expr = {};
    
