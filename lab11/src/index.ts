import { ExportWrapper, compileModule } from "../../lab09";
import { parseFunnier, resolveModule } from "../../lab10";
import { verifyModule } from "./verifier";

export async function parseVerifyAndCompile(source: string): Promise<Record<string, Function>>
{
    const ast = parseFunnier(source);
    const res = resolveModule(ast);
    await verifyModule(res);
    const mod = await compileModule(res);
    return new ExportWrapper(mod);
}
