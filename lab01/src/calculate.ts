import { Dict, MatchResult, Semantics } from "ohm-js";
import grammar, { AddMulActionDict } from "./addmul.ohm-bundle";

export const addMulSemantics: AddMulSemantics = grammar.createSemantics() as AddMulSemantics;


const addMulCalc = {
  Expr(arg0) {
    return arg0.calculate()
  },
  Add(first, _plus, rest) {
    let sum = first.calculate();
    for (let i = 0; i < rest.numChildren; i++) {
      const pair = rest.child(i);
      // const mulNode = pair.child(1);
      sum += pair.calculate();
    }
    return sum;
  },
  Mul(first, _mul, rest) {
    let prod = first.calculate();
    for (let i = 0; i < rest.numChildren; i++) {
      const pair = rest.child(i);
      // const primNode = pair.child(1);
      prod *= pair.calculate();
    }
    return prod;
  },
  Prim_number(arg0) {
    return parseInt(arg0.sourceString)
  },
  Prim_par(arg0, arg1, arg2) {
    return arg1.calculate()
  },
  number(_) {
    return parseInt(this.sourceString)
  }
} satisfies AddMulActionDict<number>

addMulSemantics.addOperation<Number>("calculate()", addMulCalc);

interface AddMulDict  extends Dict {
    calculate(): number;
}

interface AddMulSemantics extends Semantics
{
    (match: MatchResult): AddMulDict;
}
