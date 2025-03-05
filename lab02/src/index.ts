import grammar from "./rpn.ohm-bundle";
import { rpnSemantics } from "./semantics";

export function evaluate(source: string): number
{ 
    throw "Not implemented"
}
export function maxStackDepth(source: string): number
{ 
    throw "Not implemented";
}

export class SyntaxError extends Error
{
}

