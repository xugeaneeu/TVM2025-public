
export class FunnyError extends Error {
    code: string;
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
    constructor(code: string, message: string, startLine: number, startCol?:number, endCol?:number, endLine?: number)
    {
        super(message);
        this.code = code;
        this.startLine = startLine;
        this.startCol = startCol ?? 0;
        this.endCol = endCol ?? this.startCol;
        this.endLine = endLine ?? this.startLine;
    }
}

export { parseFunny, getFunnyAst  } from './parser';
export * from './funny';
