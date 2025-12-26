import { Interval, MatchResult, Semantics } from 'ohm-js';

import grammar, { FunnierActionDict } from './funnier.ohm-bundle';

import { AnnotatedFunctionDef, AnnotatedModule } from './funnier';
import { checkModule, ErrorCode, fail, getFunnyAst, parseOptional, Predicate } from '@tvm/lab08';

type FailurePos = { lineNum?: number; colNum?: number } | null;

type MatchWithInfo = MatchResult & {
  getRightmostFailurePosition?: () => FailurePos;
  message?: string;
};

function getParseFailureInfo(match: MatchResult): { message: string; pos: FailurePos } {
  const m = match as MatchWithInfo;
  const message = m.message ?? "Syntax error in Funny module.";
  const pos = typeof m.getRightmostFailurePosition === "function"
    ? m.getRightmostFailurePosition()
    : null;
  return { message, pos };
}

type SourceRange = {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
};

interface LineCol {
  lineNum: number;
  colNum: number;
}

interface RawSource {
  startIdx: number;
  endIdx: number;
  getLineAndColumn: (idx: number) => LineCol;
}

interface NodeLike {
  source?: RawSource | null;
  parse?: () => unknown;
}

function getLocFromNode(node: any): SourceRange | undefined {
  const interval = node.source as Interval;
    const start = interval.getLineAndColumn();
    const endInterval = interval.collapsedRight();
    const end = endInterval.getLineAndColumn();
    return {
        startLine: start.lineNum,
        startCol: start.colNum,
        endLine: end.lineNum,
        endCol: end.colNum,
    };
}

function attachLoc<T extends object>(value: T, node: any): T {
    const loc = getLocFromNode(node);
    if (loc) {
        (value as any).loc = loc;
    }
    return value;
}

function parseAndAttachPredicate(node?: NodeLike | null): Predicate {
  if (!node || typeof node.parse !== "function") {
    throw new Error("Expected a parseable predicate node");
  }
  const p = node.parse() as Predicate;
  return attachLoc(p, node);
}

const getFunnierAst = {
  ...getFunnyAst,

  Function(name, _lp, params, _rp, preOpt, retSpec, postOpt, usesOpt, stmt) {
    const base = getFunnyAst["Function"](name, _lp, params, _rp, retSpec, usesOpt, stmt) as any;

    return {
      ...base,
      
      pre: parseOptional<Predicate | null>(preOpt, null),
      post: parseOptional<Predicate | null>(postOpt, null),
    } as AnnotatedFunctionDef;
  },

  PreSpec(_requires: any, pred: NodeLike) {
    return parseAndAttachPredicate(pred);
  },

  PostSpec(_ensures: any, pred: NodeLike) {
    return parseAndAttachPredicate(pred);
  },

  InvariantSpec(_inv: any, pred: NodeLike) {
    return parseAndAttachPredicate(pred);
  }

} satisfies FunnierActionDict<any>;

export const semantics: FunnySemanticsExt = grammar.Funnier.createSemantics() as FunnySemanticsExt;
semantics.addOperation("parse()", getFunnierAst);
export interface FunnySemanticsExt extends Semantics
{
  (match: MatchResult): FunnyActionsExt
}

interface FunnyActionsExt 
{
  parse(): AnnotatedModule;
}

export function parseFunnier(source: string, origin?: string): AnnotatedModule
{
  const match = grammar.Funnier.match(source, "Module");

  if (match.failed()) {
    const { message, pos } = getParseFailureInfo(match);
    fail(ErrorCode.ParseError, message, {
      startLine: pos?.lineNum,
      startCol: pos?.colNum,
    });
  }

  const mod = (semantics as FunnySemanticsExt)(match).parse();
  checkModule(mod);
  return mod;
}