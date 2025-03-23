import { testFilesInFolder } from '../../lab08/tests/testFilesInFolder';
import { parseVerifyAndCompile } from "../src";

describe('11. Testing the sample files', () => {
    testFilesInFolder("./lab10/samples", parseVerifyAndCompile);
});


