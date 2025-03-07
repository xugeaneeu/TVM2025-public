import { parseFunny} from "../../lab08";

import { compileModule as compileModule } from "./compiler";
import { resolveModule } from "./resolver";

export class ExportWrapper implements Record<string, Function>
{
    #exports: WebAssembly.Exports;
    constructor(exports: WebAssembly.Exports)
    {
        this.#exports = exports;
        return new Proxy(this, {
            get(target, p: string): Function | undefined
            {
                if(p == "then")
                    return undefined; // fail the Promise test

                const f = target.#exports[p];
                if (typeof f !== "function")
                    return undefined;

                return (...a: any[])=>
                {
                    if(a.length != f.length)
                        throw new Error(`Argument count mistmatch. Expected: ${f.length}, passed: ${a.length}.`);
                    return f(...a);
                }
            }
        })
    }
    [x: string]: Function;
}

export async function parseAndCompile(source: string): Promise<Record<string, Function>>
{
    const ast = parseFunny(source);
    const res = resolveModule(ast);
    const mod = await compileModule(res);
    return new ExportWrapper(mod);
}

export * from './resolver';
export * from './compiler';