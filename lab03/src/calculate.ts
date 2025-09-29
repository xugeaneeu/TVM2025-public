import { MatchResult } from "ohm-js";
import grammar, { ArithmeticActionDict, ArithmeticSemantics } from "./arith.ohm-bundle";

export const arithSemantics: ArithSemantics = grammar.createSemantics() as ArithSemantics;


const arithCalc = {
  Expr(arg0) {
    return arg0.calculate(this.args.params);
  },
  AddSub(arg0, arg1, arg2) {
    let result = arg0.calculate(this.args.params);
    for (let i = 0; i < arg2.numChildren; i++) {
      const node = arg2.child(i);
      const value = node.calculate(this.args.params);
      if (arg1.child(i).sourceString == "+") {
        result += value;
      } else {
        result -= value;
      }
    }
    return result;
  },
  DivMul(arg0, arg1, arg2) {
    let result = arg0.calculate(this.args.params);
    for (let i = 0; i < arg2.numChildren; i++) {
      const node = arg2.child(i);
      const value = node.calculate(this.args.params); 
      if (arg1.child(i).sourceString == "*") {
        result *= value;
      } else {
        if (value == 0) {
          throw new Error("division by zero");
        }
        result /= value
      }
    }
    return result;
  },
  Prim_unmin(_arg0, arg1) {
    return -arg1.calculate(this.args.params);
  },
  Prim_num(arg0) {
    return arg0.calculate(this.args.params);
  },
  Prim_var(arg0) {
    return arg0.calculate(this.args.params);
  },
  Prim_par(_arg0, arg1, _arg2) {
    return arg1.calculate(this.args.params);
  },
  var(_arg0, _arg1) {
    const name = this.sourceString;
    if (!(name in this.args.params!)) {
      return NaN;
    }
    return this.args.params![name];
  },
  number(_arg0) {
    return parseInt(this.sourceString, 10);
  },
} satisfies ArithmeticActionDict<number | undefined>;


arithSemantics.addOperation<Number>("calculate(params)", arithCalc);


export interface ArithActions {
  calculate(params: {[name:string]:number}): number;
}

export interface ArithSemantics extends ArithmeticSemantics
{
  (match: MatchResult): ArithActions;
}
