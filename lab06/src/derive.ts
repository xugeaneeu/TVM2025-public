import { Expr } from "../../lab04";

export function derive(e: Expr, varName: string): Expr
{
  return simplify(derive_node(e, varName));
}

function derive_node(node: Expr, varName: string): Expr
{
  switch (node.type) {
    case "num":
      return {type: 'num', value: 0};
    case "var":
      if (node.name === varName) {
        return {type: 'num', value: 1};
      } else {
        return {type: 'num', value: 0};
      }
    case "neg":
      return {type: 'neg', arg: derive_node(node.arg, varName)};
    case "bin":
      const left_d = derive_node(node.left, varName);
      const right_d = derive_node(node.right, varName); 
      switch (node.op) {
        case "+":
        case "-":
          return {type: 'bin', op: node.op, left: left_d, right: right_d};
        case "*":
          return {type: 'bin', op: '+', left: {type: 'bin', op: '*', left: left_d, right: node.right}
                                      , right: {type: 'bin', op: '*', left: node.left, right: right_d}};
        case "/":
          return {type: 'bin', op: '/', left: {type: 'bin', op: '-', left: {type: 'bin', op: '*', left: left_d, right: node.right}
                                                                   , right: {type: 'bin', op: '*', left: node.left, right: right_d}}
                                      , right: {type: 'bin', op: '*', left: node.right, right: node.right}};
      }
  }
}

function simplify(e: Expr): Expr
{
  switch (e.type) {
    case "num":
      return e;
    case "var":
      return e;
    case "neg":
      const arg = simplify(e.arg);
      if (arg.type === "neg") {
        return arg.arg;
      }
      if (isZero(arg)) {
        return {type: "num", value: 0};
      }
      if (arg.type === 'num') {
        return {type: "num", value: -arg.value};
      }
      if (arg.type === 'bin' && arg.op === '/') {
        if (arg.left.type === 'neg') {
          return {type: 'bin', op: '/', left: arg.left.arg, right: arg.right};
        }
        if (arg.left.type === 'num') {
          return {type: 'bin', op: '/', left: {type: 'num', value: -arg.left.value}, right: arg.right};
        }
      }
      return {type: "neg", arg: arg};

    case "bin":
      const left_s = simplify(e.left);
      const right_s = simplify(e.right);

      if (left_s.type === 'num' && right_s.type === 'num') {
        switch (e.op) {
          case "+": return {type: 'num', value: left_s.value + right_s.value};
          case "-": return {type: 'num', value: left_s.value - right_s.value};
          case "*": return {type: 'num', value: left_s.value * right_s.value};
          case "/": return {type: 'num', value: (left_s.value / right_s.value) | 0};
        }
      }

      switch (e.op) {
        case "+":
          if (isZero(left_s)) return right_s;
          if (isZero(right_s)) return left_s;
          return {type: 'bin', op: '+', left: left_s, right: right_s};
        case "-":
          if (isZero(right_s)) return left_s;
          if (isZero(left_s)) return simplify({type: 'neg', arg: right_s});
          return {type: 'bin', op: '-', left: left_s, right: right_s};
        case "*":
          if (isZero(left_s) || isZero(right_s)) return {type: 'num', value: 0};
          if (isOne(left_s)) return right_s;
          if (isOne(right_s)) return left_s;
          return {type: 'bin', op: '*', left: left_s, right: right_s};
        case "/":
          if (isOne(right_s)) return left_s;
          return {type: 'bin', op: '/', left: left_s, right: right_s};

      }
  }
}

function isZero(e: Expr): boolean
{
  return (e.type === "num" && e.value === 0);
}

function isOne(e: Expr): boolean
{
  return (e.type === "num" && e.value === 1);
}
