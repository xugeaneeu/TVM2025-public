import { FunnyError } from '../../lab09';
import { 
    readFileSync, 
    readdirSync  } from 'fs';
import { join as pathJoin, parse as pathParse} from 'path';
import { parseAndResolveFunnier } from '../src';
  
const testRe = /^(?<name>.*?)($|(\.Error\.(?<startLine>\d+)(\.(?<startCol>\d+)((-(?<endLine>\d+)\.)?(?<end>\d+))?)?))/;

describe('9. Testing the sample files', () => {
    const sampleDir = "./solutions/lab11/samples";
    let files = readdirSync(sampleDir, {withFileTypes: true, recursive:true});
    //console.log(files);
    for(const file of files)
    {
        const filePathString = pathJoin(file.parentPath, file.name);
        const filePath = pathParse(filePathString);
        const filePathStringUniversal = filePathString.replaceAll('\\', '/'); 
        if (!file.isDirectory() && filePath.ext == ".funnier")
        {
            const name = filePath.name.replaceAll(".", " ");
            const sample = readFileSync(filePathString, 'utf-8');
            const m = filePath.base.match(testRe);
            if(m && m.groups && m.groups.startLine)
            {
                const startLine = Number.parseInt(m.groups.startLine);
                const startCol = m.groups.start ? Number.parseInt(m.groups.start) : undefined;
                const endLine = m.groups.endLine ? Number.parseInt(m.groups.endLine): undefined;
                const endCol = m.groups.end ? Number.parseInt(m.groups.end): undefined;
                const name = m.groups.name.replaceAll(".", " ");
                test(name, () => expect( () =>parseAndResolveFunnier(sample, filePathStringUniversal)).toThrow(new FunnyError("0", "f", startLine, startCol, endLine, endCol)));
       
                //console.log(pathJoin(file.parentPath, file.name));
            }
            else // no error specified in the file name
                test(name, () => expect( () =>parseAndResolveFunnier(sample, filePathStringUniversal)).not.toThrow())

        }
    }
});
