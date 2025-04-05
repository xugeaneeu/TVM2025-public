import { desiredMark } from '../../desiredMark.json';
import { addIntGroup, testRe } from '../../lab08/tests/testFilesInFolder';
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
                    var e = {};
                    addIntGroup(e, m.groups, 'startLine');
                    addIntGroup(e, m.groups, 'startCol');
                    addIntGroup(e, m.groups, 'endLine');
                    addIntGroup(e, m.groups, 'endCol');
                    test(name, () => expect(async () => (await parseFunc(sample))).rejects.toThrow(
                        expect.objectContaining(e)));
                }
                else // no error specified in the file name
                    test(name, async () => expect(async () => await parseFunc(sample)).not.toThrow());
            }
        }
    }
}
