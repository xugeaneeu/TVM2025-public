
Funnier <: Funny {
  Function
    := var "(" ParamList ")" PreSpec? RetSpec PostSpec? UsesSpec? Statement

  PreSpec
    = "requires" Predicate

  PostSpec
    = "ensures" Predicate
}
