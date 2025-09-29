import { grammar } from "ohm-js";
import { ReversePolishNotationActionDict} from "./rpn.ohm-bundle";

export const rpnCalc = {
  Expr_num(arg0) {
    return arg0.calculate();
  },
  Expr_summul(arg0, arg1, arg2) {
    if (arg2.sourceString === "+") {
      return arg0.calculate() + arg1.calculate();
    } else if (arg2.sourceString === "*") {
      return arg0.calculate() * arg1.calculate();        
    }
  },
  number(arg0) {
    return parseInt(this.sourceString, 10);
  },
} satisfies ReversePolishNotationActionDict<number>;
