# Funnier Language

Funnier language extends the Funny language to supports the formal verification of the functions.

Specifically, Funnier supports the following additional constructs:

1. Specifying the pre- and post-conditions for the function via the optional `requires` and mandatory `ensures` clauses
2. Specifying the cycle invariants with an optional `invariant` clause
3. Supporting the `exists` and `forall` quantifiers in preconditions, postconditions, and invariants
4. Supporting *formulas* in addition to functions

This guide outlines only the language differences; refer to the [Funny Language](../lab08/funny.md) document for the core language specification.

## Function Definition

The Funnier function definition extends the Funny function as follows:

```EBNF
function = identifier                           (* function name *)
    "(" [ variableDef {"," variableDef  } ] ")" (* function parameter(s) *)
    ["requires" predicate ]                     (* function precondition *)
    "returns" variableDef {"," variableDef }    (* function return value(s) *)
    ["ensures" predicate ]                      (* function postcondition *)
    [ "uses" variableDef {"," variableDef } ]   (* function local variable(s) *)
    statement;                                  (* function body *)

```

Function precondition can use only the function parameters. If omitted, the precondition is assumed to be `true`, i.e. satisfied for all argument values.

Function postcondition can use function parameters and return values. If omitted, poscondition is assumed to be `false`, i.e. never satisfied.
This assumption helps porting the Funny programs to Funnier: all Funny function definitions would be syntactically correct, but without providing the meaningful postconditions those functions would fail the validation.

> While it is tempting to represent the necessity to specify the postcondition for each function via syntax, this approach proves to be counter-productive.
  Forcing a stricter syntax provides small if any simplification of the semantic analysis phase, but delivers a substantial loss in the end-user functionality.
>
> Generally speaking, syntax errors are blocking the parse process; so a straightforward parser would never produce more than a single syntax error.
  Semantic errors, on the other hand, don't necessarily block the validation process, so the compiler can detect and report multiple problems at once.
  This provides so much better end-user experience that the real-world parsers do often opt in to intentionally use a substantially relaxed syntax compared to the official language specification. While general *parser error recovery* is way beyond this course scope, it worth mentioning at this tiny example.


## Predicate

Predicates in Funnier are similar to the [conditions](../lab08/funny.md#conditions).
Those are Boolean formulas as well, but the predicate atoms allow two additional constructs - *quantifiers* and *formula references*:

```EBNF
predicate = 

  quantifier
  | formulaRef

  | "true" | "false"
  | comparison
  | "not" predicate
  | predicate "and" predicate
  | predicate "or" predicate
  | "(" predicate ")";

```

### Quantifiers

The quantifier construct allows to declare the existential and the universal quantifiers in predicates.

```EBNF
quantifier = ("forall" | "exists") (* quantifier type *)
    "(" variableDef                (* predicate variable *)
        "|" predicate              (* predicate *)
     ")";
```

**Note** that the variable name declared in the quantifier must be unique within the scope that contains the quantifier:

- function precondition scope contains all function parameters
- function postcondition scope contains all function parameters and return values
- loop invariant scope contains all function parameters, return values, and local variables

### Formula References

Formula references behave similar to the function calls, used within predicates only. Formula references cannot be used in conditions nor in expressions.

```EBNF
formulaRef = identifier         (* formula name *)
    "(" [ expr {"," expr} ] ")" (* formula arguments *)
```

Formula reference must refer to an existing formula definition.

## Formula Definition

Formula is a special kind of function to be used in the predicates. It does never get compiled to the Wasm code, and is used only in compile-time:

```EBNF
formula = identifier                            (* formula name *)
    "(" [ variableDef {"," variableDef  } ] ")" (* formula parameter(s) *)
    "=> " predicate;                            (* formula body *)
```

The formula body can use only the constants and formula parameters.

## Loop Statement

The loop statement in Funnier has an optional `invariant` clause:

```EBNF
while = "while" "(" condition ")" 
    [ "invariant" predicate ]
    statement;
```

If omitted, the loop invariant is assumed to be `true`. This clause is intentionally made optional just like the function pre- and post-conditions, for the same reasons.
