// import { compileFunction } from "../src";
import { test } from "../../mark";
import { deriveAndCalculate, deriveAndPrint } from "../src";


describe("Numerical tests", ()=>{
    test("C' = 0", 3, deriveAndCalculate, 0, "35+7", "x");
    test("(f + g)' = f' + g' 1", 3, deriveAndCalculate, 0, "2+x*y", "x", 42, 0);
    test("(f + g)' = f' + g' 2", 3, deriveAndCalculate, 5, "2+x*y", "x", 42, 5);
    test("(f - g)' = f' - g' 1", 3, deriveAndCalculate, 0, "2-x*y", "x", 42, 0);
    test("(f - g)' = f' - g' 2", 3, deriveAndCalculate, -5, "2-x*y", "x", 42, 5);    
    test("(f*g)' == f'*g + f*g' 1", 3, deriveAndCalculate, 0, "x*y", "x", 0, 0);
    test("(f*g)' == f'*g + f*g' 2", 3, deriveAndCalculate, 10, "x*y", "x", 10, 10); 
    test("(f/g)' == (f'*g - f*g')/(g^2) 1", 3, deriveAndCalculate, 1, "x/y", "x", 1, 1);
    test("(f/g)' == (f'*g - f*g')/(g^2) 2", 3, deriveAndCalculate, 1, "x/y", "x", 10, 1);
    test("(f/g)' == (f'*g - f*g')/(g^2) 3", 3, deriveAndCalculate, -1, "x/y", "y", 1, 1);
    test("(f/g)' == (f'*g - f*g')/(g^2) 3", 3, deriveAndCalculate, -4, "x/y", "y", 16, 2);
});

describe("Structural tests", ()=>{
    test("Constant derives to zero 1", 3, deriveAndPrint, "0", "42", "x");
    test("Constant derives to zero 2", 4, deriveAndPrint, "0", "-42", "x");
    test("Variable derives to one", 3, deriveAndPrint, "1", "x", "x");
    test("Variable derives by other variable to zero", 3, deriveAndPrint, "0", "x", "y");
    test("(f + g)' = f' + g' 1", 4, deriveAndPrint, "2 + y", "2*x+x*y", "x");
    test("(f + g)' = f' + g' 2", 4, deriveAndPrint, "x", "2*x+x*y", "y");
    test("(f - g)' = f' - g' 1", 4, deriveAndPrint, "2 - y", "2*x-x*y", "x");
    test("(f - g)' = f' - g' 2", 4, deriveAndPrint, "-x", "2*x-x*y", "y");    
    test("(f - g)' = f' - g' 3", 4, deriveAndPrint, "x", "x*y-x*2", "y");    
    test("(f*g)' == f'*g + f*g' 1", 4, deriveAndPrint, "y", "x*y", "x");
    test("(f*g)' == f'*g + f*g' 2", 4, deriveAndPrint, "x", "x*y", "y");
    test("(f*g)' == f'*g + f*g' 3", 4, deriveAndPrint, "x * y * f * g * h", "x*y*z*f*g*h", "z");
    test("(f / g)' = (f'*g - g'*f)/g*g ", 4, deriveAndPrint, "1 / (y * y)", "5*x-1/y", "y");
});
