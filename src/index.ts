import * as Library from "./main";

export default Library;
export * from "./main";

export type NDArray<T> = (T | NDArray<T>)[];

export type Infinity = 1e999;
type ToNumberOrInfinity<M extends number> = number extends M ? Infinity : M;

type FDArray<T, U> = U extends readonly [unknown, ...infer U] ? FDArray<T[], U> : T;
export type MDArray<T, U extends readonly unknown[]> = number extends U["length"] ? NDArray<T> : FDArray<T, U>;

type _ArrayOfLength<L extends number, T extends readonly number[]> = T["length"] extends L
  ? T
  : _ArrayOfLength<L, [...T, number]>;
export type ArrayOfLength<L extends number> = L extends Infinity ? number[] : _ArrayOfLength<L, []>;

export type BuildIndices<T extends readonly unknown[]> = { [P in keyof T]: number };

type _Indices<T, U extends readonly number[], M extends number> = NDArray<T> extends T
  ? ArrayOfLength<M>
  : U["length"] extends M
  ? U
  : T extends readonly (infer T)[]
  ? _Indices<T, [...U, number], M>
  : U;
export type Indices<T, M extends number = Infinity> = _Indices<T, [], ToNumberOrInfinity<M>>;

type _Shape<T, U extends readonly number[], M extends number> = NDArray<T> extends T
  ? ArrayOfLength<M>
  : U["length"] extends M
  ? U
  : T extends readonly never[]
  ? [...U, number]
  : T extends readonly (infer T)[]
  ? _Shape<T, [...U, number], M>
  : U;
export type Shape<T, M extends number = Infinity> = _Shape<T, [], ToNumberOrInfinity<M>>;

type _Map<T, S, U extends readonly unknown[]> = NDArray<T> extends T
  ? MDArray<S, U>
  : T extends readonly unknown[]
  ? number extends U["length"]
    ? { [P in keyof T]: _Map<T[P], S, U> }
    : U extends readonly [unknown, ...infer U]
    ? { [P in keyof T]: _Map<T[P], S, U> }
    : S
  : S;
export type Map<T, S, M extends number = Infinity> = _Map<T, S, ArrayOfLength<ToNumberOrInfinity<M>>>;

type _ElementType<T, M extends number> = M extends Infinity
  ? T extends NDArray<infer T> | readonly (infer T)[]
    ? ElementType<T, M>
    : T
  : Access<T, ArrayOfLength<M>>;
export type ElementType<T, M extends number = Infinity> = _ElementType<T, ToNumberOrInfinity<M>>;

type AllElements<T, U> = T extends readonly (infer T)[] ? AllElements<T, U | T> : U;
type _Access<T, U> = U extends readonly [infer P, ...infer U]
  ? P extends PropertyKey
    ? T extends Record<P, unknown>
      ? _Access<T[P], U>
      : T
    : T
  : T;
export type Access<T, U extends readonly unknown[]> = NDArray<T> extends T
  ? T
  : number extends U["length"]
  ? AllElements<T, never>
  : _Access<T, U>;

type Pop<T> = T extends readonly [...infer T, unknown] ? T : T;
type Extract<T> = T extends readonly unknown[] ? T : never;
export type Parent<T, M extends number = Infinity> = Extract<Access<T, Pop<Indices<T, ToNumberOrInfinity<M>>>>>;

// Credit
// https://github.com/microsoft/TypeScript/issues/48052#issuecomment-1053607666
// https://github.com/microsoft/TypeScript/issues/30680#issuecomment-752725353
// https://github.com/millsp/ts-toolbelt/blob/master/sources/Function/Narrow.ts
export type Cast<A, B> = A extends B ? A : B;
type _Narrow<A> = [] | (A extends string | number | bigint | boolean ? A : never) | { [K in keyof A]: _Narrow<A[K]> };
export type Narrow<A> = Cast<A, _Narrow<A>>;
