import { match, P } from "ts-pattern";
import { AnnotatedModule } from './funnier';

export interface ResolvedAnnotatedModule extends AnnotatedModule
{
    functions: ResolvedAnnotatedFunction[]
}
export interface ResolvedAnnotatedFunction
{

}

export function resolveModule(m: AnnotatedModule): ResolvedAnnotatedModule
{
    throw "Not implemented";
}



