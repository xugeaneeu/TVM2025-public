export class FunnyError extends Error {
  constructor(
    message: string,
    public readonly code: string, 
    public readonly startLine?: number, 
    public readonly startCol?:number, 
    public readonly endCol?:number, 
    public readonly endLine?: number)
  {
    super(message);
  }
}

export const enum ErrorCode {
  ParseError = 'PARSE_ERROR',
  DuplicateFunction = 'DUPLICATE_FUNCTION',
  Redeclaration = 'REDECLARATION',
  AssignArity = 'ASSIGN_ARITY',
  AssignUndeclaredVar = 'ASSIGN_UNDECLARED_VAR',
  AssignUndeclaredArray = 'ASSIGN_UNDECLARED_ARRAY',
  UseUndeclaredVar = 'USE_UNDECLARED_VAR',
  OperatorMultiValue = 'OPERATOR_MULTI_VALUE',
  UnknownFunction = 'UNKNOWN_FUNCTION',
  ArgumentCount = 'ARGUMENT_COUNT',
  ArgumentMultiValue = 'ARGUMENT_MULTI_VALUE',
  AccessUndeclaredArray = 'ACCESS_UNDECLARED_ARRAY',
  ArrayIndexMultiValue = 'ARRAY_INDEX_MULTI_VALUE',
  ComparisonMultiValue = 'COMPARISON_MULTI_VALUE',
  VerificationError = 'E_VERIFICATION_ERROR',
}

export * from './parser';
export * from './funny';
