import { Arith, ArithSort, Bool, Context, init, Model, SMTArray, SMTArraySort } from "z3-solver";

import { printZ3Model } from "./printZ3Model";
import { AnnotatedModule } from "../../lab10";


async function initZ3()
{
    if(!z3)
    {
        const Z3C = (await init()).Context;
        z3 = Z3C('main');        
    }
}

export let z3: Context;

export async function verifyModule(module: AnnotatedModule)
{
    await initZ3();
    throw "Not implemented"

}

function convertConditionsToZ3(p: Predicate): Bool
{
    throw "Not implemented";
}
async function proveTheorem(b: Bool): Promise<"ok" | Model>
{
    throw "Not implemented"
} 


interface Predicate
{
    // todo: add features 
}