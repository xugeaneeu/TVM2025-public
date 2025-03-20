import { readFileSync } from "fs";
import { join as pathJoin, parse as pathParse} from 'path';
import { test } from "../../mark";
import { parseAndCompile } from "../src";

import { sampleDir } from '../../lab08/tests/index.test';


async function testOneResult<T = number>(fileName: string, funcName: string, ...args: number[]): Promise<T>
{
    const module = await parseAndCompile(readFileSync(pathJoin(sampleDir, fileName+'.funny'), 'utf-8'));
    return module[funcName](...args);
}

// async function testFactorial(a: number): Promise<number>
// {
//     const fm = await parseAndCompile(readFileSync(pathJoin(sampleDir, 'factorial_recursive.funny'), 'utf-8'));
//     return fm.factorial(a);
// }

// async function testCall(a: number): Promise<number>
// {
//     const fm = await parseAndCompile(readFileSync(pathJoin(sampleDir, 'call.funny'), 'utf-8'));
//     return fm.bar(a);
// }

// async function testConstant(): Promise<number>
// {
//     const fm = await parseAndCompile(readFileSync(pathJoin(sampleDir, 'constant.funny'), 'utf-8'));
//     return fm.constant();
// }
// async function testExpression(): Promise<number>
// {
//     const fm = await parseAndCompile(readFileSync(pathJoin(sampleDir, 'expression.funny'), 'utf-8'));
//     return fm.expression();
// }

describe('Testing the sample programs', () => {
    test('constant', 3, testOneResult<number>, 42, '3.fortyTwo', 'fortyTwo');
    test('expression', 3, testOneResult<number>, 42, '3.sixBySeven', 'sixBySeven');
    test('increment', 3, testOneResult<number>, 42, '3.increment', 'increment', 41);
    test('local var usage', 3, testOneResult<number>, 42, '3.functionWithLocals', 'foo', 10, 4);
    test('call', 4, testOneResult<number>, 86, '4.call', 'bar', 2);
});


