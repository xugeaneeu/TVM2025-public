# Funny Language

Funny allows the user to define a module with one or more named *functions*.
This module gets compiled into a WebAssembly module.

## Basics

The language is whitespace-agnostic, i.e. any number of consequitive spaces, tabs, and newlines does have the same semantics as a single space would. In the grammars below whitespace is permitted between any rules in the concatenation operation. When two terminals are written sequentially in the concatenation operation this means that the space between them is optional.

Comments in Funny start with double-slash (`//`) and end with the newline. Comments are considered whitespace as well - i.e. they split a lexical unit, but have no meaning otherwise.

### Constants

Funny supports the integer numeric constants written as digit sequences, having the type `int`, and the boolean constants `true` and `false`.

### Identifiers

Identifiers in Funny start with a latin letter, and can contain arbitrary number of letters and digits.

### Exceptions

Funny does throw a few exceptions:

- division by zero throws
- array access out of bounds throws

Since Funny does not have any means for exception handling, these exception can only be caught in the external code calling the Funny module.

## Functions and Types

All of the functions defined in the Funny module are automatically exported.
Each function does have zero or more input parameters and one or more output parameters.

Funny supports two data types for the inputs and outputs:

- `int` refers to a 32-bit signed (two's complement) integer
- `int[]` refers to an array of `int`

Function can optionally declare local variables.
Local variables can be only of the `int` type.

The names of function input parameters, output parameters, and local variables must be unique within the function.

Functions can call the other functions, including the direct and indirect recursion.

Function names should be unique within module; no overloads are permitted.

The syntax of the function defintion is as follows:

```EBNF
function = identifier                           (* function name *)
    "(" [ variableDef {"," variableDef  } ] ")" (* function parameter(s) *)
    "returns" variableDef {"," variableDef }    (* function return value(s) *)
    [ "uses" variableDef {"," variableDef } ]   (* function local variable(s) *)
    statement;                                  (* function body *)

variableDef = 
  identifier (* variable name*)
    ":" variableType;

variableType = "int" | "int[]";
```

## Statements

There are four statement types in Funny:

```EBNF
statement = assignment | conditional | loop | block;
```

### Assignment Statement

Assignment statement has the following form:

```EBNF
assignment = 
    varName = expr ";"
    | arrayAccess = expr ";"
    | varName { "," varName } = functionCall ";"
```

The latter form is a tuple assignment; it applies to the functions returning multiple results. See the [Function Call](#function-call) subsection below for more detail.

Note that the function parameters are treated as read-only - those cannot be used on the left side of the assignment statement. This covers the arrays as well - a read-only array cannot be used on the left side of the assignment.

Both local variables and output parameters are treated as read-write.
Reading before an explicit assignment is not an error, but the contents of the unitialized variables are undefined.

### Conditional Statement

The conditional statement has the following form:

```EBNF
conditional = "if" "(" condition ")" statement ["else" statement];
```

Nested conditional statements are right-associative. Here the `else` belongs to the second `if`:

```funny
if (x > 0) if (y < 0) z = 1; else z = 5;
// equivalent to:
if (x > 0) 
{ 
    if (y < 0) 
        z = 1; 
    else z = 5;
}
// NOT to:
if (x > 0) 
{ 
    if (y < 0) 
        z = 1; 
}
else 
    z = 5;
```

### Loop Statement

The loop statement has the following form:

```EBNF
while = "while" "(" condition ")" statement;
```

### Block Statement

The block statement allows to group a few statements together:

```EBNF
block = "{" { statement } "}";
```

Note that semicolon is not a "statement separator" - it is a part of the assignment statement.

## Expressions

The Funny expressions are basically the same as in [Lab 03](../lab03/), with two additional atoms:

```EBNF
expr = 
    functionCall
  | arrayAccess

  | number
  | variable
  | "-" expr
  | expr "+" expr 
  | expr "*" expr
  | expr "-" expr
  | expr "/" expr
  | "(" expr ")";
```

### Function Call

The function call expression uses the positional arguments:

```EBNF
functionCall = identifier       (* function name *)
    "(" [ expr {"," expr} ] ")" (* function arguments *)
```

**Note** that only a single-return functions can be used in expressions; the function returning multiple results can either be called from the external code, or in the [tuple assignment](#assignment-statement).

The types and number of the expressions in the function argument list must match the function parameter types and number. The function name must refer to an existing function defined in the module, or the built-in function [`length`](#length-function).

#### Length Function

The `length` function returns an array length. It behaves as if it has been declared with the following signature:

```funny
length(a: int[]) returns l: int
```

## Array Access

Array access expression allows to read an array element value:

```EBNF
arrayAccess = varName "[" expr "]"
```

Variable referenced by the varName must be of an array type; expression used in the index must be of an integer type.
Array access outside of array bounds throws a runtime exception.

## Conditions

Conditional and while statements do use the *condition* constructs.
Those constructs represent the *boolean expressions*, built from the comparison expressions and `true`/`false` constants by applying conjunction, disjunction, and negation:

```EBNF
condition = 
  "true" | "false"
  | comparison
  | "not" condition
  | condition "and" condition
  | condition "or" condition
  | "(" condition ")";

comparison = 
  expr "==" expr
  | expr "!=" expr
  | expr ">=" expr
  | expr "<=" expr
  | expr ">" expr
  | expr "<" expr;

```

The following function takes two integers and returns two integers:

```funny
divide(a: int, b: int)
  returns q: int, r: int
...
```

Also function can declare a few local variables (only the `int` type is supported for locals).
The following function takes two integers, returns a single integer, and uses two local variables:

```funny
gcd(x: int, y: int)
  returns r: int
  uses a: int, b: int  // local variable declarations
```

If a function returns a single value, this value can be assigned to a variable:

```funny
g = gcd(x, y)
```

More Funny programs can be found at [src/samples/](/src/samples) folder.

