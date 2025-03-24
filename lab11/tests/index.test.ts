import { testFilesInFolder } from '../../lab08/tests/testFilesInFolder';
import { parseVerifyAndCompile } from "../src";
import { flushZ3 } from '../src/verifier';

describe('11. Testing the sample files', () => {
    testFilesInFolder("./lab10/samples", parseVerifyAndCompile);
});

afterAll(() => flushZ3())

