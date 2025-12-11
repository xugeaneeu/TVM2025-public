import { FunctionDef, Module, ParameterDef, Predicate, Statement } from 'lab08/src';


export interface AnnotatedModule extends Module {
  functions: AnnotatedFunctionDef[];
}

export interface AnnotatedFunctionDef extends FunctionDef {
  pre?: Predicate | null;
  post?: Predicate | null;
}