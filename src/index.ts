import * as Library from "./main";

export default Library;
export * from "./main";

export type NDArray<T> = (T | NDArray<T>)[];

type FDArray<T, U> = U extends readonly [unknown, ...infer U] ? FDArray<T[], U> : T;
export type MDArray<T, U extends readonly unknown[]> = number extends U["length"] ? NDArray<T> : FDArray<T, U>;

export type BuildIndices<T extends readonly unknown[]> = { [P in keyof T]: number };

type _Indices<T, U extends number[]> = NDArray<T> extends T
  ? number[]
  : T extends readonly (infer T)[]
  ? _Indices<T, [...U, number]>
  : U;
export type Indices<T> = _Indices<T, []>;

type _Shape<T, U extends number[]> = NDArray<T> extends T
  ? number[]
  : T extends readonly never[]
  ? [...U, number]
  : T extends readonly (infer T)[]
  ? _Shape<T, [...U, number]>
  : U;
export type Shape<T> = _Shape<T, []>;

export type Map<T, U> = NDArray<T> extends T
  ? NDArray<U>
  : T extends readonly unknown[]
  ? { [P in keyof T]: Map<T[P], U> }
  : U;

export type ElementType<T> = T extends NDArray<infer T> | readonly (infer T)[] ? ElementType<T> : T;

type AllElements<T, U> = T extends readonly (infer T)[] ? AllElements<T, U | T> : U;
type _Access<T, U> = U extends readonly [infer P, ...infer U]
  ? P extends PropertyKey
    ? T extends Record<P, unknown>
      ? _Access<T[P], U>
      : never
    : never
  : T;
export type Access<T, U extends readonly unknown[]> = NDArray<T> extends T
  ? T
  : number extends U["length"]
  ? AllElements<T, never>
  : _Access<T, U>;

type Pop<T> = T extends readonly [...infer T, unknown] ? T : T;
type Extract<T> = T extends readonly unknown[] ? T : never;
export type Parent<T> = Extract<Access<T, Pop<Indices<T>>>>;
