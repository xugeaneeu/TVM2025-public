import * as arith from "../../lab04";

export interface Module
{
    type: 'module';
    functions: FunctionDef[]
}
export interface FunctionDef
{
    type: 'fun';
    name: string;
    parameters: ParameterDef[];
    returns: ParameterDef[];
    locals: ParameterDef[];
}

export interface ParameterDef
{
    type: "param";
    name: string;
}