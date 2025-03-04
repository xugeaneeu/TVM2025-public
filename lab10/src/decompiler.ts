import { N } from "../../wasm/src/wasm-emitter";
import { printCode} from "../../wasm/src/lbtext";

export function printWasm(instructions: N[]): string
{
    let c: string = "";
    printCode(instructions, s => c += s);
    return c;
}