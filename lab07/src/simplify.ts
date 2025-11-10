import { Expr } from "../../lab04";
import { cost } from "./cost";

export function simplify(e: Expr, identities: [Expr, Expr][]): Expr {
  let prev: Expr;
  let curr = e;

  do {
    prev = curr;
    curr = applyOnce(curr, identities);
  } while (!equals(prev, curr));

  return curr;
}

function applyOnce(e: Expr, identities: [Expr, Expr][]): Expr {
  for (const [lhs, rhs] of identities) {
    const map1: Record<string, Expr> = {};
    if (unify(lhs, e, map1)) {
      const replaced = substitute(rhs, map1);
      if (cost(replaced) < cost(e)) {
        return replaced;
      }
    }

    const map2: Record<string, Expr> = {};
    if (unify(rhs, e, map2)) {
      const replaced = substitute(lhs, map2);
      if (cost(replaced) < cost(e)) {
        return replaced;
      }
    }
  }

  if (e.type === "neg") {
    const newArg = applyOnce(e.arg, identities);
    if (newArg !== e.arg) {
      return { type: "neg", arg: newArg };
    }
    return e;
  }

  if (e.type === "bin") {
    const newLeft = applyOnce(e.left, identities);
    if (newLeft !== e.left) {
      return { type: "bin", op: e.op, left: newLeft, right: e.right };
    }
    const newRight = applyOnce(e.right, identities);
    if (newRight !== e.right) {
      return { type: "bin", op: e.op, left: e.left, right: newRight };
    }
    return e;
  }

  return e;
}

function unify(pattern: Expr, expr: Expr, map: Record<string, Expr>): boolean {
  if (pattern.type === "num") {
    return expr.type === "num" && expr.value === pattern.value;
  }
  if (pattern.type === "var") {
    const v = pattern.name;
    if (map.hasOwnProperty(v)) {
      return equals(map[v], expr);
    } else {
      map[v] = expr;
      return true;
    }
  }
  if (pattern.type === "neg") {
    if (expr.type !== "neg") return false;
    return unify(pattern.arg, expr.arg, map);
  }
  if (expr.type !== "bin" || pattern.op !== expr.op) return false;
  
  if (pattern.op === "+" || pattern.op === "*") {
    const m1 = { ...map };
    if (
      unify(pattern.left, expr.left, m1) &&
      unify(pattern.right, expr.right, m1)
    ) {
      Object.assign(map, m1);
      return true;
    }
    const m2 = { ...map };
    if (
      unify(pattern.left, expr.right, m2) &&
      unify(pattern.right, expr.left, m2)
    ) {
      Object.assign(map, m2);
      return true;
    }
    return false;
  }

  return (
    unify(pattern.left, expr.left, map) &&
    unify(pattern.right, expr.right, map)
  );
}

function substitute(pattern: Expr, map: Record<string, Expr>): Expr {
  if (pattern.type === "num") {
    return { type: "num", value: pattern.value };
  }
  if (pattern.type === "var") {
    const v = pattern.name;
    return map.hasOwnProperty(v) ? map[v] : { type: "var", name: v };
  }
  if (pattern.type === "neg") {
    return { type: "neg", arg: substitute(pattern.arg, map) };
  }
  return {
    type: "bin",
    op: pattern.op,
    left: substitute(pattern.left, map),
    right: substitute(pattern.right, map),
  };
}

function equals(a: Expr, b: Expr): boolean {
  if (a === b) return true;
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "num":
      return b.type === "num" && a.value === b.value;
    case "var":
      return b.type === "var" && a.name === b.name;
    case "neg":
      return b.type === "neg" && equals(a.arg, b.arg);
    case "bin":
      return (
        b.type === "bin" &&
        a.op === b.op &&
        equals(a.left, b.left) &&
        equals(a.right, b.right)
      );
  }
}