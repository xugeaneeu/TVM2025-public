import { desiredMark } from '../../desiredMark.json';
import { testRe, parseInt } from '../../lab08/tests/testFilesInFolder';
import { DesiredMark } from '../../mark';
import { 
    readFileSync, 
    readdirSync  } from 'fs';
import { join as pathJoin, parse as pathParse} from 'path';

export function testFilesInFolderAsync(folder: string, parseFunc: (source: string)=>Promise<any>) {
    let files = readdirSync(folder, { withFileTypes: true, recursive: true });
    for (const file of files) {
        const filePathString = pathJoin(file.parentPath, file.name);
        const filePath = pathParse(filePathString);

        if (!file.isDirectory() && filePath.ext == ".funny") {
            const name = filePath.name.replaceAll(".", " ");
            const sample = readFileSync(filePathString, 'utf-8');
            const m = filePath.base.match(testRe);
            if (m && m.groups) {
                if (m.groups.mark as DesiredMark > desiredMark)
                    test.skip(name, () => { });

                else if (m.groups.error) {
                    const startLine = parseInt(m.groups.startLine);
                    const startCol = parseInt(m.groups.startCol);
                    const endLine = parseInt(m.groups.endLine);
                    const endCol = parseInt(m.groups.endCol);
                    test(name, () => expect(async () => (await parseFunc(sample))).rejects.toThrow(
                        expect.objectContaining({ startLine, startCol, endLine, endCol })));
                }
                else // no error specified in the file name
                    test(name, async () => expect(async () => await parseFunc(sample)).resolves.not.toThrow());
            }
        }
    }
}
