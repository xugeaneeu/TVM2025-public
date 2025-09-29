import { ReversePolishNotationActionDict } from "./rpn.ohm-bundle";
export type StackDepth = {max: number, out: number};

export const rpnStackDepth = {
  Expr_num(arg0) {
    return arg0.stackDepth;
  },
  Expr_summul(arg0, arg1, arg2) {
    const L = arg0.stackDepth as StackDepth;
    const R = arg1.stackDepth as StackDepth;
    const out = L.out + R.out - 1;
    const max = Math.max(L.max, L.out + R.max);
    return {max, out};
  },
  number(arg0) {
    return {max: 1, out: 1};
  }
} satisfies ReversePolishNotationActionDict<StackDepth>;
