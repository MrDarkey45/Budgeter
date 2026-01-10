declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export interface StatementIterator {
    next(): StatementIteratorResult;
  }

  export interface StatementIteratorResult {
    done: boolean;
    value: Statement;
  }

  export interface ParamsObject {
    [key: string]: unknown;
  }

  export type ParamsCallback = (obj: ParamsObject) => void;
  export type BindParams = unknown[] | ParamsObject | null;

  export class Statement {
    bind(params?: BindParams): boolean;
    step(): boolean;
    getAsObject(params?: ParamsObject): ParamsObject;
    get(params?: BindParams): unknown[];
    getColumnNames(): string[];
    free(): boolean;
    reset(): void;
    run(params?: BindParams): void;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: BindParams): Database;
    exec(sql: string, params?: BindParams): QueryExecResult[];
    each(sql: string, params: BindParams, callback: ParamsCallback, done?: () => void): Database;
    each(sql: string, callback: ParamsCallback, done?: () => void): Database;
    prepare(sql: string, params?: BindParams): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
    create_function(name: string, func: (...args: unknown[]) => unknown): Database;
    create_aggregate(name: string, funcs: { init: () => unknown; step: (...args: unknown[]) => void; finalize: () => unknown }): Database;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
