import { desiredMark } from '../../desiredMark.json';
import { DesiredMark } from '../../mark';
import { FunnyError, parseFunny } from '../src';
import { 
    readFileSync, 
    readdirSync  } from 'fs';
import { join as pathJoin, parse as pathParse} from 'path';
  
const testRe = /^(?<mark>[^\.]+)\.(?<name>.*?)($|(\.Error\.(?<startLine>\d+)(\.(?<startCol>\d+)((-(?<endLine>\d+)\.)?(?<end>\d+))?)?))/;

describe('08. Testing the sample files', () => {
    const sampleDir = "./lab08/samples";
    let files = readdirSync(sampleDir, {withFileTypes: true, recursive:true});
    //console.log(files);
    for(const file of files)
    {
        const filePathString = pathJoin(file.parentPath, file.name);
        const filePath = pathParse(filePathString);
    
        if (!file.isDirectory() && filePath.ext == ".funny")
        {
            const name = filePath.name.replaceAll(".", " ");
            const sample = readFileSync(filePathString, 'utf-8');
            const m = filePath.base.match(testRe);
            if(m && m.groups)
            {
                if(m.groups.mark as DesiredMark > desiredMark)
                    test.skip(name, ()=>{})
                else
                    if(m.groups.startLine)
                    {
                        const startLine = Number.parseInt(m.groups.startLine);
                        const startCol = m.groups.start ? Number.parseInt(m.groups.start) : undefined;
                        const endLine = m.groups.endLine ? Number.parseInt(m.groups.endLine): undefined;
                        const endCol = m.groups.end ? Number.parseInt(m.groups.end): undefined;
                        // const name = m.groups.name.replaceAll(".", " ");
                        test(name, () => expect( () => parseFunny(sample)).toThrow(
                            expect.objectContaining({startLine, startCol, endLine, endCol})));
            
                        //console.log(pathJoin(file.parentPath, file.name));
                    }
                    else // no error specified in the file name
                        test(name, () => expect( () => parseFunny(sample)).not.toThrow())
            }
        }
    }
});
