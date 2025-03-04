# Translation and Compilation Methods

This is the set of hands-on excercises to support the lecture course of Translation and Compilation Methods taught on
[FIT NSU](https://www.nsu.ru/n/information-technologies-department/) as a part of the [09.03.01](https://www.nsu.ru/n/information-technologies-department/education_fit/programs/OOP/09-03-01/piikn/piikn.php) education program.

## Introduction

This set of excercises aims at building the verifying translator from an imaginary language Funnier into WASM.
The code of these excercises is based on the following technologies:

- Implementation language: [Typescript](https://www.typescriptlang.org/)
- Execution environment: [Node.js](https://nodejs.org/)
- Compilation target: [Wasm](https://webassembly.org/)
- Theorem prover: [Z3](https://github.com/Z3Prover/z3) via the [z3-solver](https://www.npmjs.com/package/z3-solver) package
- Package manager: [pnpm](https://pnpm.io/)
- Parser library: [Ohm](https://ohmjs.org/)
- Autotests: [Jest](https://jestjs.io/) (may be replaced)
- IDE: [VS Code](https://code.visualstudio.com/) (optional)

## Excercise Evaluation

There are a set of goals for each excercise. The goals are tagged with the mark. In order to get a C mark (3) for the whole practice, one must achieve all the goals marked with C. To get a B, one needs to achive all the B **and** all the C goals, and so on.
To verify the solutions, one should use the built-in test framework: specify the desired mark in the file [desiredMark.json](desiredMark.json), and run the auto-tests. The tests for the goals above the requested mark would be automatically skipped.

## Contents and Solution Order

The recommended order of implementation is starting from Lab 01 and proceeding sequentially through Lab 12:

- [Lab 01](./lab01/): Addition and Multiplication
- [Lab 02](./lab02/): Reverse Polish Notation
- [Lab 03](./lab03/): Arithmetic with Variables
- [Lab 04](./lab04/): Parsing to AST
- [Lab 05](./lab05/): Compiling to Wasm
- [Lab 06](./lab06/): Symbolic Derivation
- [Lab 07](./lab07/): Symbolic Simplification
- [Lab 08](./lab08/): Parsing Funny
- [Lab 09](./lab09/): Compiling Funny
- [Lab 10](./lab10/): Parsing Funnier
- [Lab 11](./lab11/): Verifying Funnier

Some of the labs can be done out-of-order, but many do depend on each other. Here is the complete dependency map:

```mermaid
flowchart LR
    Lab01[<a href="./lab01">Lab01</a>]
    Lab02[<a href="./lab02">Lab02</a>]
    Lab03[<a href="./lab03">Lab03</a>]
    Lab04[<a href="./lab04">Lab04</a>]
    Lab05[<a href="./lab05">Lab05</a>]
    Lab06[<a href="./lab06">Lab06</a>]
    Lab07[<a href="./lab07">Lab07</a>]
    Lab08[<a href="./lab08">Lab08</a>]
    Lab09[<a href="./lab09">Lab09</a>]
    Lab10[<a href="./lab10">Lab10</a>]
    Lab11[<a href="./lab11">Lab11</a>]

    
    Lab03 --> Lab04
    Lab04 --> Lab05
    Lab04 --> Lab06
    Lab03 --> Lab07
    Lab04 --> Lab07
    Lab03 --> Lab08
    Lab04 --> Lab08
    Lab08 --> Lab09
    Lab08 --> Lab10
    Lab09 --> Lab10
    Lab04 --> Lab11
    Lab09 --> Lab11
    Lab10 --> Lab11
```

**Note**: getting the passing mark requires *breadth*, i.e. completing all the excercises on the desired level. The recommended approach to this course is to focus on getting all the labs done with the basic goals (setting the desired mark to 3 and making sure all the tests are passed). Then try to improve the depth by changing the desired mark to 4, and fixing the broken tests if any.
This approach ensures smart resource allocation - if one doesn't have enough time to complete all the excercises, they would better get a passing mark than risking to get *half* the labs solved at a perfect level.

## Prerequisites and Installation

1. Download and install Node.js with pnpm for your platform: [https://nodejs.org/en/download](https://nodejs.org/en/download)
2. Checkout this project.
3. Run a terminal at the project root location and execute

   ```pnpm install -r```

   This will download and install the dependencies for all the labs
4. (Optional) download and install VS Code: [https://code.visualstudio.com/Download](https://code.visualstudio.com/Download)
   - Install recommended extensions. Support for JavaScript and TypeScript is included in VS Code out of the box.
   Two extra tools would be handy
      - *Jest* extension helps you running the unit tests (that are going to be the basis of the excercise acceptance)
      - *Ohm-JS Language* extension helps you to write the PEG grammars extensively used throughout this course

5. Build a lab
   - **VS Code**: open any file in the ```src``` folder of any lab, press Shift-Ctrl-B.

     **Note**: the build command searches for the package manifest one level above the current file; this would cause a "No package.json not found" in case the command is issued when the ```package.json``` or ```tsconfig.json``` are open in the editor

   - **CLI**: run terminal at the root folder of any lab; execute ```pnpm run build```

6. Run tests

   **Note**: don't forget to set the desired mark via the ```desiredMark.json```!
   - **VS Code**: switch to the Testing tab, hover the project root, click "Run Tests" icon
   - **CLI**: run the ```jest``` command at the project root
