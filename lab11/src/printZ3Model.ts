import { Model } from "z3-solver";

export function printZ3Model(m: Model): string
{
    return m.sexpr();
}