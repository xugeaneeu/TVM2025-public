import { testFilesInFolder } from '../../lab08/tests/index.test';
import { parseVerifyAndCompile } from "../src";

describe('11. Testing the sample files', () => {
    testFilesInFolder("./lab10/samples", parseVerifyAndCompile);
});


