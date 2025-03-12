# Lab 11: Verifying Funny

[[RU](README.ru.md)|EN]

This lab is the summit of the whole excercises course.
It builds upon the labs [09](../lab09/README.md) and [10](../lab10/README.md) to parse, compile, and verify the Funny modules.

## Goal

Now we need to verify the correctness of every function defined in the Funny module.
The exact process of generating the Verification Conditions is described in the lectures.

Once the verification conditions for the whole function are ready, we would translate these conditions into a *theorem definition* in the Z3 Theorem Prover language.
Then we would delegate the laborous job of proving this theorem to Z3, get back the results, and report those to the user.

If everything is done properly, our compiler will detect the implementation errors (function code mismatching the specifications) and report those to the user; and only the verified code would be compiled to Wasm for the execution.

## Tasks

Update the [verifier.ts](src/verifier.ts) to:

1. Implement the function `buildFunctionVerificationConditions()` to generate the verification conditions
2. Implement the function `convertConditionsToZ3()` to convert the conditions represented as the Funny predicate into a Z3 assertion
3. Implement the function `proveTheorem` to call Z3 solver with the assertion built on the previous steps, and interpret the results of the proof

## Evaluation

- C | 3 | Hey, Not Too Rough:
  - Verify the simple functions without loops, function calls, and formula references
- B | 4 | Hurt Me Plenty:
  - Implement verification of the functions that include loops and/or recursion
- A | 5 | Ultra-Violence:
  - Implement support for the formula references
- A+ | 5+ | Nightmare:
  - Report an exact location of the verification failure
  - Implement support for the run-time verification: in case the some of the verification conditions is neither proven nor disproven, inject a Wasm code to verify it in runtime and throw an exception. Report verification failure in case annotation cannot be converted to the Wasm code
