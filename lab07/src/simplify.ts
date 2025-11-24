import { Expr } from "../../lab04";
import { cost } from "./cost";

type Op = '+' | '-' | '*' | '/';
const neg = (e: Expr): Expr => ({ type: 'neg', arg: e });
const bin = (op: Op, l: Expr, r: Expr): Expr => ({ type: 'bin', op, left: l, right: r });

function encode(e: Expr): string {
  switch (e.type) {
    case "num": return `#${e.value}`;
    case "var": return `$${e.name}`;
    case "neg": return `~(${encode(e.arg)})`;
    case "bin": return `(${encode(e.left)}${e.op}${encode(e.right)})`;
  }
}

type Env = Record<string, Expr>;

function match(pattern: Expr, expr: Expr, varMap: Env = {}): Env | null {
  switch (pattern.type) {
    case "num":
      return (expr.type === "num" && expr.value === pattern.value) ? varMap : null;

    case "var":
      const name = pattern.name;
      const bound = varMap[name];
      if (bound) {
        return equals(bound, expr) ? varMap : null;
      }
      return { ...varMap, [name]: expr };

    case "neg":
      return expr.type === "neg" ? match(pattern.arg, expr.arg, varMap) : null;

    case "bin":
      if (expr.type !== "bin" || expr.op !== pattern.op) return null;
      const envL = match(pattern.left, expr.left, varMap);
      return envL ? match(pattern.right, expr.right, envL) : null;
  }
}

function substitute(template: Expr, varMap: Env): Expr {
  switch (template.type) {
    case "num": return template;
    case "var": return varMap[template.name] || template
    case "neg": return neg(substitute(template.arg, varMap));
    case "bin": return bin(template.op as Op, substitute(template.left, varMap), substitute(template.right, varMap));
  }
}

type Rebuilder = (replacement: Expr) => Expr;
function* tree(e: Expr): Generator<[Expr, Rebuilder]> {
  yield [e, (r: Expr) => r];
  
  switch (e.type) {
    case "num":
    case "var":
      return;

    case "neg":
      for (const [sub, rebuild] of tree(e.arg)) {
        yield [sub, (r: Expr) => rebuild(neg(r))];
      }
      return;

    case "bin":
      for (const [subL, rebuildL] of tree(e.left)) {
        yield [subL, (r: Expr) => rebuildL(bin(e.op as Op, r, e.right))];
      }
      for (const [subR, rebuildR] of tree(e.right)) {
        yield [subR, (r: Expr) => rebuildR(bin(e.op as Op, e.left, r))];
      }
      return;
  }
}


export function simplify(e: Expr, identities: [Expr, Expr][]): Expr {
  const seen = new Set<string>();
  const q: Expr[] = [e];
  let best: Expr = e;
  let bestCost = cost(e);

  let steps = 0;
  let limit = 1000;

  while (q.length && steps < limit) {
    steps++;

    const cur = q.shift()!;
    const key = encode(cur);
    if (seen.has(key)) continue;
    seen.add(key);

    const c = cost(cur);
    if (c < bestCost) {
      best = cur;
      bestCost = c;
    }

    for (const [lhs, rhs] of identities) {
      for (const [sub, rebuild] of tree(cur)) {
        const env = match(lhs, sub);
        if (env) {
          const transformed = substitute(rhs, env);
          const res = rebuild(transformed);
          const resKey = encode(res);

          if (!seen.has(resKey)) {
            const resCost = cost(res);
            if (resCost < c + 3) {
              q.push(res);
            } 
          }
        }
      }
    }
  }

  return best;
}

function equals(a: Expr, b: Expr): boolean {
  if (a === b) return true;
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "num": return b.type === "num" && a.value === b.value;
    case "var": return b.type === "var" && a.name === b.name;
    case "neg": return b.type === "neg" && equals(a.arg, b.arg);
    case "bin":
      return b.type === "bin" && 
             a.op === b.op && 
             equals(a.left, b.left) && 
             equals(a.right, b.right);
  }
}