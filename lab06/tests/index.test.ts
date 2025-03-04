// import { compileFunction } from "../src";
import { test } from "../../mark";
import { deriveAndCalculate, deriveAndPrint } from "../src";


describe("6. Numerical tests", ()=>{
    test("6. C' = 0", 3, deriveAndCalculate, 0, "  35 +7", "x");
    test("6. (f + g)' = f' + g' 1", 3, deriveAndCalculate, 2, "2*x+x*y", "x", 42, 0);
    test("6. (f + g)' = f' + g' 2", 3, deriveAndCalculate, 7, "2*x+x*y", "x", 42, 5);
    test("6. (f - g)' = f' - g' 1", 3, deriveAndCalculate, 2, "2*x-x*y", "x", 42, 0);
    test("6. (f - g)' = f' - g' 2", 3, deriveAndCalculate, -3, "2*x-x*y", "x", 42, 5);    
    test("6. (f*g)' == f'*g + f*g' 1", 3, deriveAndCalculate, 0, "x*y", "x", 0, 0);
    test("6. (f*g)' == f'*g + f*g' 2", 3, deriveAndCalculate, 10, "x*y", "x", 10, 10); 
    test("6. (f/g)' == (f'*g - f*g')/(g^2) 1", 3, deriveAndCalculate, 1, "x/(x+1)", "x", 0);
    test("6. (f/g)' == (f'*g - f*g')/(g^2) 2", 3, deriveAndCalculate, 0, "x/(x+1)", "x", 1);
});

describe("6.2 Structural tests", ()=>{
    test("6.2 Constant derives to zero 1", 3, deriveAndPrint, "0", "42", "x");
    test("6.2 Constant derives to zero 2", 3, deriveAndPrint, "0", "-42", "x");
    test("6.2 Variable derives to one", 3, deriveAndPrint, "1", "x", "x");
    test("6.2 Variable derives by other variable to zero", 3, deriveAndPrint, "0", "x", "y");
    test("6.2 (f + g)' = f' + g' 1", 4, deriveAndPrint, "2 + y", "2*x+x*y", "x");
    test("6.2 (f + g)' = f' + g' 2", 4, deriveAndPrint, "x", "2*x+x*y", "y");
    test("6.2 (f - g)' = f' - g' 1", 4, deriveAndPrint, "2 - y", "2*x-x*y", "x");
    test("6.2 (f - g)' = f' - g' 2", 4, deriveAndPrint, "-x", "2*x-x*y", "y");    
    test("6.2 (f - g)' = f' - g' 3", 4, deriveAndPrint, "x", "x*y-x*2", "y");    
    test("6.2 (f*g)' == f'*g + f*g' 1", 4, deriveAndPrint, "y", "x*y", "x");
    test("6.2 (f*g)' == f'*g + f*g' 2", 4, deriveAndPrint, "x", "x*y", "y");
    test("6.2 (f*g)' == f'*g + f*g' 3", 4, deriveAndPrint, "x * y * f * g * h", "x*y*z*f*g*h", "z");
    test("6.2 (f / g)' = (f'*g - g'*f)/g*g ", 4, deriveAndPrint, "1 / (y * y)", "5*x-1/y", "y");
});
