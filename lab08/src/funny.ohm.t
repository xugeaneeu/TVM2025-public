
Funny <: Arithmetic {
  Module
    = Function+

  Function
    = var "(" ParamList ")" PreSpec? RetSpec PostSpec? UsesSpec? Statement

  PreSpec
    = "requires" Predicate
  
  PostSpec 
    = "ensures" Predicate

  RetSpec
    = "returns" ParamListNonEmpty -- list
    | "returns" "void"            -- void

  UsesSpec
    = "uses" ParamList

  ParamList
    = ListOf<Param, ",">

  ParamListNonEmpty
    = NonemptyListOf<Param, ",">

  Param
    = var ":" Type

  Type
    = "int" "[]"  -- array
    | "int"       -- int

  ArgList
    = ListOf<Expr, ",">

  Block
    = "{" Statement* "}"

  Statement
    = Assign   -- assign
    | Block    -- block
    | While    -- while
    | If       -- if
    | Expr ";" -- expr

  While
    = "while" "(" Condition ")" InvariantSpec? Statement

  InvariantSpec
    = "invariant" Predicate

  If
    = "if" "(" Condition ")" Statement ("else" Statement)?

  Assign
    = LValueList "=" ExprList ";"  -- tuple
    | LValue "=" Expr ";"          -- simple

  LValueList
    = ListOf<LValue, ",">

  ExprList
    = ListOf<Expr, ",">

  LValue
    = ArrayAccess                  -- array
    | var                        -- var

  Prim
    := FunctionCall
     | ArrayAccess
     | ...

  FunctionCall
    = var "(" ArgList ")"

  ArrayAccess
    = var "[" Expr "]"

  Condition
    = ImplyCond

  ImplyCond
    = OrCond "->" ImplyCond        -- imply
    | OrCond

  OrCond
    = AndCond ("or" AndCond)*

  AndCond
    = NotCond ("and" NotCond)*

  NotCond
    = ("not")* AtomCond

  AtomCond
    = "true"                       -- true
    | "false"                      -- false
    | Comparison                   -- comparison
    | "(" Condition ")"            -- paren

  Comparison
    = Expr "==" Expr               -- eq
    | Expr "!=" Expr               -- neq
    | Expr ">=" Expr               -- ge
    | Expr "<=" Expr               -- le
    | Expr ">"  Expr               -- gt
    | Expr "<"  Expr               -- lt

  Predicate
    = ImplyPred

  ImplyPred
    = OrPred "->" ImplyPred        -- imply
    | OrPred

  OrPred
    = AndPred ("or" AndPred)*

  AndPred
    = NotPred ("and" NotPred)*

  NotPred
    = ("not")* AtomPred

  AtomPred
    = Quantifier                   -- quantifier
    | FormulaRef                   -- formulaRef
    | "true"                       -- true
    | "false"                      -- false
    | Comparison                   -- comparison
    | "(" Predicate ")"            -- paren

  Quantifier
    = ("forall" | "exists")
      "(" Param "|" Predicate ")"

  FormulaRef
    = var "(" ParamList ")"

  space += lineComment | blockComment
  lineComment  = "//" (~"\n" any)* ("\n" | end)
  blockComment = "/*" (~"*/" any)* "*/"
}