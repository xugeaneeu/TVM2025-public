import { readdirSync, readFileSync } from "fs";
import { join as pathJoin, parse as pathParse} from 'path';
import { test } from "../../mark/out";
import { parseVerifyAndCompile } from "../src";

const testRe = /^(?<name>.*?)($|(\.Error\.(?<startLine>\d+)(\.(?<startCol>\d+)((-(?<endLine>\d+)\.)?(?<end>\d+))?)?))/;

// async function testFactorial(a: number): Promise<number>
// {
//     const fm = await parseVerifyAndCompile(readFileSync('./solutions/lab11/samples/factorial.funny', 'utf-8'));
//     return fm.factorial(a);
// }

// async function testCall(a: number): Promise<number>
// {
//     const fm = await parseVerifyAndCompile(readFileSync('./solutions/lab11/samples/call.funny', 'utf-8'));
//     return fm.bar(a);
// }

// async function testConstant(): Promise<number>
// {
//     const fm = await parseVerifyAndCompile(readFileSync('./solutions/lab11/samples/constant.funny', 'utf-8'));
//     return fm.constant();
// }
// async function testExpression(): Promise<number>
// {
//     const fm = await parseVerifyAndCompile(readFileSync('./solutions/lab11/samples/expression.funny', 'utf-8'));
//     return fm.expression();
// }

describe('11. Testing the sample files', () => {
    // test('call', 4, testCall, 86, 2);
    // test('constant', 4, testConstant, 42);
    // test('expression', 4, testExpression, 42);
    // test('factorial', 4, testFactorial, 120, 5);
    const sampleDir = "./lab10/samples";
    let files = readdirSync(sampleDir, {withFileTypes: true, recursive:true});
    //console.log(files);
    for(const file of files)
    {
        const filePathString = pathJoin(file.parentPath, file.name);
        const filePath = pathParse(filePathString);
    
        if (!file.isDirectory() && filePath.ext == ".funnier")
        {
            const name = filePath.name.replaceAll(".", " ");
            const sample = readFileSync(filePathString, 'utf-8');
            const m = filePath.base.match(testRe);
            if(m && m.groups && m.groups.startLine)
            {
                // const startLine = Number.parseInt(m.groups.startLine);
                // const startCol = m.groups.start ? Number.parseInt(m.groups.start) : undefined;
                // const endLine = m.groups.endLine ? Number.parseInt(m.groups.endLine): undefined;
                // const endCol = m.groups.end ? Number.parseInt(m.groups.end): undefined;
                // const name = m.groups.name.replaceAll(".", " ");
                test(name, 3, parseVerifyAndCompile, Error, sample);
       
                //console.log(pathJoin(file.parentPath, file.name));
            }
            else // no error specified in the file name
                test(name, 3, parseVerifyAndCompile, {}, sample);
        }
    }
});


