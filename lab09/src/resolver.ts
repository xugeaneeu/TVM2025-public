import { match, P } from "ts-pattern";
import { Module } from "../../lab08";

export interface ResolvedModule extends Module
{
    // todo: add features
}


export function resolveModule(m: Module): ResolvedModule
{
    throw "Not implemented"
}
