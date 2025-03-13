import { test } from "../../mark";
import { Expr, parseExpr } from "../../lab04";

import { simplify, cost } from "../src";

const estimate = (source: string) => cost(parseExpr(source));

describe('Testing cost function', ()=>
{
    test("const cost is zero", 3, estimate, 0, "42");
    test("var cost is one", 3, estimate, 1, "x");
    test("unary minus cost is one", 3, estimate, 2, "-x");
    test("addition cost is 1 a", 3, estimate, 1, "42+1");
    test("addition cost is 1 b", 3, estimate, 2, "42+x");
    test("addition cost is 1 c", 3, estimate, 4, "x+42+y");

    test("multiplication cost is 1 a", 3, estimate, 1, "42*1");
    test("multiplicationcost is 1 b", 3, estimate, 2, "42*x");
    test("multiplication cost is 1 c", 3, estimate, 4, "x*42*y");

    test("subtraction cost is 1 a", 3, estimate, 1, "42-1");
    test("subtraction is 1 b", 3, estimate, 2, "42-x");
    test("subtraction cost is 1 c", 3, estimate, 4, "x-42-y");

    test("complex expressions are estimated properly", 4, estimate, 6, "(x+y)*(a+1)");


});

const parseSimplifyAndCost = (source: string, identities: ()=>[Expr, Expr][]) => cost(simplify(parseExpr(source), identities()));

describe('Testing simplify function', ()=>
{
    test("42+0 => 42", 3, parseSimplifyAndCost, 0, "42+0", basicIdentities);
    test("x+0 => x", 3, parseSimplifyAndCost, 1, "a+0", basicIdentities);
    test("x*0 => 0", 3, parseSimplifyAndCost, 0, "a*0", basicIdentities);
    test("x*(1-1)=>0", 4, parseSimplifyAndCost, 0, "a*(1-1)", basicIdentities);
    test("x-0 => x", 3, parseSimplifyAndCost, 1, "x-0", basicIdentities);
});











const parseIdentities = 
    (identities: [string, string][]): [Expr, Expr][] => identities.map(([l,r])=>[parseExpr(l), parseExpr(r)]);

const basicIdentities = () =>
    parseIdentities([
        ["x+0", "x"],
        ["x*0", "0"],
        ["x-0", "x"],
        ["x-x", "0"],
        ["x*1", "x"],
        ["-1*x", "-x"],
        ["x+x", "2*x"], // ?
        ["x/1", "x"],
        ["--x", "x"],
        ["x--y", "x+y"]
    ]);

const commutativeIdentities = () =>
    parseIdentities([
        ["x+y", "y+x"],
        ["x*y", "y*x"],
        ["x-y", "x+-y"],
    ]);

const distributiveIdentities = () =>
    parseIdentities([
        ["a*(b+c)", "a*b + a*c"],
    ]);

const regroupIdentities = () => 
    parseIdentities([
        ["a+(b+c)","b+(c+a)"],
    ]);
