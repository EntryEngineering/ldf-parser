import { LdfResult } from "./types";
export declare function isResultEmpty(res: any): boolean;
export declare function parseFile(file: Blob): Promise<LdfResult>;
export declare function parseString(ldfString: string): LdfResult;
