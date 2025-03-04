import { SyntaxError } from "../../lab03";
import { test } from "../../mark";
import { parseCompileAndExecute } from "../src";

describe('4. testing addition and multiplication regression', () => {
    test("4. Empty expression is invalid", 3, parseCompileAndExecute, SyntaxError, "");
    test("4. Number is a valid expression", 3, parseCompileAndExecute, 42, "42");
    test("4. Addition is a valid expression", 3, parseCompileAndExecute, 42, "35+7");
    test("4. Spaces are permitted in the addition", 3, parseCompileAndExecute, 42, "  35 +7");
    test("4. Tabs are permitted in the addition", 3, parseCompileAndExecute, 42, "7\t+35");
    test("4. Newlines are permitted in the addition", 3, parseCompileAndExecute, 42, `
        35  +
        7`);
    test("4. Multiple additions are valid", 3, parseCompileAndExecute, 42, "5+4+3+2 +1+ 2+3 + 4+5+6+7");
    test("4. Multiplication is a valid expression", 3, parseCompileAndExecute, 42, "6*7");
    test("4. Multiplication is performed before addition (1)", 3, parseCompileAndExecute, 42, "6*6+6");
    test("4. Multiplication is performed before addition (2)", 3, parseCompileAndExecute, 42, "7+5*7");
  
    test("4. Complex expressions are supported", 3, parseCompileAndExecute, 42, "7+2*7+3*6+3");
    test("4. Parentheses are correctly supported", 3, parseCompileAndExecute, 42, "(2+1)*7+(3*2*3)+2*(1+0)+1");
    test("4. Extra paren are ok", 3, parseCompileAndExecute, 42, "(2+1)*7+(3*(2)*3)+2*((1+(0)))+1");
    test("4. Numbers with spaces are invalid", 3, parseCompileAndExecute, SyntaxError, "42 7");
    test("4. Incomplete addition is invalid", 3, parseCompileAndExecute, SyntaxError, "42+");
    test("4. Standalone + is invalid", 3, parseCompileAndExecute, SyntaxError, "+42");
    test("4. Sequential pluses are invalid", 3, parseCompileAndExecute, SyntaxError, "7++35");
    test("4. Incomplete multiplication is invalid", 3, parseCompileAndExecute, SyntaxError, "42*");
    test("4. Standalone * is invalid", 3, parseCompileAndExecute, SyntaxError, "*42");
});

describe('4. testing subtraction and division', () => {
    test("4. Subtraction is supported", 3, parseCompileAndExecute, 21, "42-21");
    test("4. Subtraction is left-associative", 3, parseCompileAndExecute, 5, "10-4-1");
    test("4. Associativity is preserved across addition and subtraction", 3, parseCompileAndExecute, 3, "5+2-4");
    test("4. Associativity can be overriden via parentheses (1)", 3, parseCompileAndExecute, 5, "5+(2-4)+(3-1)");
    test("4. Associativity can be overriden via parentheses (2)", 4, parseCompileAndExecute, -1, "(5+2)-(4+3)-1");
    
    test("4. Division is supported", 3, parseCompileAndExecute, 2, "42/21");
    test("4. Division is left-associative", 3, parseCompileAndExecute, 1, "8/4/2");
    test("4. Division by zero gets runtime error", 3, parseCompileAndExecute, WebAssembly.RuntimeError, "1/0");
});
describe('4. testing unary negation', () => {
    test("unary minus is supported", 3, parseCompileAndExecute, 42, "43+-1");
    test("double unary minus is supported", 3, parseCompileAndExecute, 42, "41--1");
});
describe('testing variables', () => {
    test("variables can be used", 3, parseCompileAndExecute, 42, "x+1", 41);
    test("4. undefined variables yield RuntimeError", 4, parseCompileAndExecute, WebAssembly.RuntimeError, "x+y");
    test("4. Dividing undefined by zero yields RunTimeError", 3, parseCompileAndExecute, WebAssembly.RuntimeError, "x/0");
    test("4. complex expressions are supported", 3, parseCompileAndExecute, 42, "(x*y+1)*y*x", 3, 2);
    test("4. Dividing defined by zero gets runtime error", 3, parseCompileAndExecute, WebAssembly.RuntimeError, "1/x", 0);
});
