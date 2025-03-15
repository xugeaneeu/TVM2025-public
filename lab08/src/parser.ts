import { getExprAst } from '../../lab04';
import * as ast from './funny';

import grammar, { FunnyActionDict } from './funny.ohm-bundle';

import { MatchResult, Semantics } from 'ohm-js';

export const getFunnyAst = {
    // write rules here
} satisfies FunnyActionDict<any>;

export const semantics: FunnySemanticsExt = grammar.Funny.createSemantics() as FunnySemanticsExt;
semantics.addOperation("parse()", getFunnyAst);
export interface FunnySemanticsExt extends Semantics
{
    (match: MatchResult): FunnyActionsExt
}
interface FunnyActionsExt 
{
    parse(): ast.Module;
}

export function parseFunny(source: string): ast.Module
{
    throw "Not implemented";
}