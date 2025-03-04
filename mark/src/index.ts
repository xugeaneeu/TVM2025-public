import { desiredMark } from "../../desiredMark.json";
import { test as testJs } from '@jest/globals';
export type DesiredMark = 3|4|5;


export function test<T extends any[], R>(name: string, testMark: DesiredMark, fn:(...args:T)=>R, expected: ResultOrException<R>, ...args:T): void
{
    if (desiredMark >= testMark)
    {
        if(typeof expected === "function") // Exception case
            testJs(name, async () => await expect(async () => (await fn(...args))).rejects.toThrow(expected as ExceptionType));
        else
            testJs(name, async () => expect(await fn(...args)).toEqual(expected));
    }
    else
        testJs.skip(name, ()=>{});
};

type ResultOrException<R> = ExceptionType | Awaited<R>;

interface ExceptionType {
    new(...args: any[]): any;
}
