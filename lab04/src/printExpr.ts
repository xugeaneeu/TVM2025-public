import { Expr } from "./ast";

const prec: Record<string, number> = {
  'num': 4,
  'var': 4,
  'neg': 3,
  '*': 2,
  '/': 2,
  '+': 1,
  '-': 1,
};

export function printExpr(e: Expr): string {
  return go(e, 0);
}

function go(e: Expr, ctxPrec: number): string {
  switch (e.type) {
    case 'num':
      return e.value.toString();

    case 'var':
      return e.name;

    case 'neg': {
      const myPrec = prec['neg'];
      const inner = go(e.arg, myPrec);
      const s = '-' + inner;
      return myPrec < ctxPrec ? `(${s})` : s;
    }

    case 'bin': {
      const myPrec = prec[e.op];

      const left = go(e.left, myPrec);
      
      const isLeftAssoc = (e.op === "-" || e.op === "/");
      const right = go(e.right, myPrec + (isLeftAssoc ? 1 : 0));

      const s = `${left} ${e.op} ${right}`;
      return myPrec < ctxPrec ? `(${s})` : s;
    }
  }
}
