// import { compileFunction } from "../src";
import { test } from "../../mark";
import { parseAndPrint } from "../src";

describe('5. testing addition and multiplication regression', () => {
//    setupMark();
    test("5. Number prints to itself", 3, parseAndPrint, "42", "42");
    test("5. Addition is properly spaced", 3, parseAndPrint, "35 + 7", "  35 +7");
    test("5. Tabs are removed from the addition", 3, parseAndPrint, "7 + 35", "7\t+35");
    test("5. Newlines are removed from the addition", 3, parseAndPrint, "35 + 7", `
        35  +
        7`);
    test("5. Parentheses are removed from addition", 3, parseAndPrint, "5 + 4 + 3 + 2 + 1 + 2 + 3 + 4 + 5 + 6 + 7", "5+((4+3)+2) +1+ (2+3 + 4)+5+6+7" );
    test("5. Multiplication is properly spaced", 3, parseAndPrint, "6 * 7", "6*7");
    test("5. Multiplication is performed before addition (1)", 3, parseAndPrint, "6 * 6 + 6", "(6*6)+6");
    test("5. Multiplication is performed before addition (2)", 3, parseAndPrint, "7 + 5 * 7", "7+(5*7)");
    test("5. Multiplication is performed before addition (3)", 3, parseAndPrint, "6 * (6 + 6)", "6*(6+6)");
    test("5. Multiplication is performed before addition (4)", 3, parseAndPrint, "(7 + 5) * 7", "(7+5)*7");
  
    test("5. Complex expressions are supported", 3, parseAndPrint, "7 + 2 * 7 + 3 * 6 + 3", "7+2*7+3*6+3");
    test("5. Parentheses are correctly supported", 3, parseAndPrint, "(2 + 1) * 7 + 3 * 2 * 3 + 2 * (1 + 0) + 1", "(2+1)*7+(3*2*3)+2*(1+0)+1");
    test("5. Extra paren are removed", 3, parseAndPrint, "(2 + 1) * 7 + 3 * 2 * 3 + 2 * (1 + 0) + 1", "(2+1)*7+(3*(2)*3)+2*((1+(0)))+1");
    });
describe('5. Testing subtraction and division', () => {
    test("5. Subtraction is supported", 3, parseAndPrint, "42 - 21", "42-21");
    test("5. Subtraction is left-associative", 4, parseAndPrint, "10 - 4 - 1", "10-4-1");
    test("5. Associativity is preserved across addition and subtraction", 4, parseAndPrint, "5 - 2 - 4", "5-2-4");
    test("5. Associativity can be overriden via parentheses", 4, parseAndPrint, "5 + 2 - (4 + 3) - 1", "(5+2)-(4+3)-1");
    test("5. Division is supported", 3, parseAndPrint, "42 / 21", "42/21");
    test("5. Division is left-associative", 4, parseAndPrint, "8 / 4 / 2", "8/4/2");
    test("5. Division associativity can be overriden", 4, parseAndPrint, "8 / (4 / 2)", "8/(4/2)");
});
describe('5. Testing unary negation', () => {
    test("5. Unary minus is supported in addition", 3, parseAndPrint, "43 + -1", "43+-1");
    test("5. Unary minus in addition is properly parenthesized 1", 3, parseAndPrint, "43 + -1", "(43)+-(1)");
    test("5. Unary minus in addition is properly parenthesized 2", 3, parseAndPrint, "43 + -1", "(43)+(-1)");
    test("5. Unary minus is supported in subtraction", 3, parseAndPrint, "43 - -1", "43--1");
    test("5. Unary minus in subtraction is properly parenthesized 1", 3, parseAndPrint, "43 - -1", "(43)--(1)");
    test("5. Unary minus in subtraction is properly parenthesized 2", 3, parseAndPrint, "43 - -1", "(43)-(-1)");
});
describe('testing variables', () => {
    test("5. variables can be used", 3, parseAndPrint, "x + 1", "x+1");
    test("5. Two variables are handled", 3, parseAndPrint, "x + y", "x+y");
    test("5. Complex expressions are properly printed",  3, parseAndPrint, "(x * y + 1) * y * x", "(x*y+1)*y*x");
});