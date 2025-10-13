import { MatchResult } from 'ohm-js';
import {arithGrammar,
        ArithmeticActionDict,
        ArithmeticSemantics,
        SyntaxError} from '../../lab03';
import { Expr } from './ast';

export const getExprAst: ArithmeticActionDict<Expr> = {
  Expr(arg0) {
    return arg0.parse();
  },
  AddSub(arg0, arg1, arg2) {
    let result: Expr = arg0.parse();
    for (let i = 0; i < arg2.numChildren; i++) {
      const op = arg1.child(i).sourceString as '+' | '-';
      const rhs: Expr = arg2.child(i).parse();
      result = {type: 'bin', op, left: result, right: rhs}
    }
    return result;
  },
  DivMul(arg0, arg1, arg2) {
    let result: Expr = arg0.parse();
    for (let i = 0; i < arg2.numChildren; i++) {
      const op = arg1.child(i).sourceString as '*' | '/';
      const rhs: Expr = arg2.child(i).parse();
      result = {type: 'bin', op, left: result, right: rhs}
    }
    return result;
  },
  Prim_unmin(_arg0, arg1) {
    return {type: 'neg', arg: arg1.parse()} as Expr;
  },
  Prim_num(arg0) {
    return {type: 'num', value: parseInt(arg0.sourceString, 10)} as Expr;
  },
  Prim_var(arg0) {
    return {type: 'var', name: arg0.sourceString} as Expr;
  },
  Prim_par(_arg0, arg1, _arg2) {
    return arg1.parse() as Expr;
  },
}

export const semantics = arithGrammar.createSemantics() as ArithSemanticsExt;
semantics.addOperation<Expr>("parse()", getExprAst);

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
  const match = arithGrammar.match(source);

  if (match.failed()) {
    throw new SyntaxError(match.message);
  }

  return semantics(match).parse();
}
