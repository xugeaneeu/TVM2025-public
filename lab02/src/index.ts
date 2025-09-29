import { MatchResult } from "ohm-js";
import grammar from "./rpn.ohm-bundle";
import { rpnSemantics } from "./semantics";

export function evaluate(source: string): number
{ 
  return calculate(parse(source));
}

export function maxStackDepth(source: string): number
{
  return rpnSemantics(parse(source)).stackDepth.max;
}

function parse(content: string): MatchResult
{
  const match = grammar.match(content);
  if (match.failed()) {
    throw new SyntaxError(match.message);
  }
  return match;
}

function calculate(expression: MatchResult):number
{
  return rpnSemantics(expression).calculate();
}

export class SyntaxError extends Error
{
}
