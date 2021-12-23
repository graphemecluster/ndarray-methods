type NDArray<T> = (T | NDArray<T>)[];

function isCallable(item: unknown): item is Function {
  return typeof item === "function";
}
function isArrayLike(item: unknown): item is unknown[] {
  if (Array.isArray(item)) return true;
  if (!item || typeof item !== "object" || Object.prototype.hasOwnProperty.call(item, "length")) return false;
  const object = item as ArrayLike<unknown>;
  if (typeof object.length !== "number") return false;
  if (!object.length) return true;
  return object.length > 0 && Object.prototype.hasOwnProperty.call(object, object.length - 1);
}
function assertNonEmpty(array: unknown[]) {
  if (!array.length) throw new RangeError("the length of the array must not be zero");
}
function forEach<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any) {
  Array.prototype.forEach.call(array, callbackfn, thisArg);
}
function map<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any) {
  return Array.prototype.map.call(array, callbackfn, thisArg) as U[];
}

function toValidIndex(index: number | undefined, array: unknown[]) {
  if (typeof index === "undefined" || index === -Infinity) return 0;
  return index >= 0 ? index : Math.max(array.length + index, 0);
}
function toValidLastIndex(index: number | undefined, array: unknown[]) {
  if (typeof index === "undefined" || index === Infinity) return array.length - 1;
  return index >= 0 ? Math.min(index, array.length - 1) : array.length + index;
}
function toValidEndIndex(index: number | undefined, array: unknown[]) {
  if (typeof index === "undefined" || index === Infinity) return array.length;
  return index >= 0 ? Math.min(index, array.length) : array.length + index;
}

export function buildShape<T>(array: number[], mapfn: (...indices: number[]) => T, thisArg?: any): NDArray<T>;
export function buildShape<T>(array: number[], value: T): NDArray<T>;
export function buildShape<T>(array: number[], valueOrMapfn: T | ((...indices: number[]) => T), thisArg?: any) {
  assertNonEmpty(array);
  return isCallable(valueOrMapfn)
    ? (function recursive([length, ...rest]: number[], mapfn: (...indices: number[]) => T): NDArray<T> {
        return rest.length
          ? Array.from({ length }, (_, index) => recursive(rest, (...indices: number[]) => mapfn(index, ...indices)))
          : Array.from({ length }, (_, index) => mapfn.call(thisArg, index));
      })(array, valueOrMapfn)
    : (function recursive([length, ...rest]: number[], value: T): NDArray<T> {
        return rest.length ? Array.from({ length }, () => recursive(rest, value)) : Array.from({ length }, () => value);
      })(array, valueOrMapfn);
}

export function nestedMap<T, U>(
  array: NDArray<T>,
  callbackfn: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => U,
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): NDArray<U> {
    return map(parent, (value, index) =>
      isArrayLike(value)
        ? recursive(value, indices.concat(index))
        : callbackfn.call(thisArg, value, indices.concat(index), array, parent)
    );
  })(array, []);
}

export function nestedForEach<T>(
  array: NDArray<T>,
  callbackfn: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => void,
  thisArg?: any
) {
  (function recursive(parent: NDArray<T>, indices: number[]) {
    forEach(parent, (value, index) => {
      isArrayLike(value)
        ? recursive(value, indices.concat(index))
        : callbackfn.call(thisArg, value, indices.concat(index), array, parent);
    });
  })(array, []);
}

export function nestedSplit(separators: (string | RegExp)[], content: string) {
  assertNonEmpty(separators);
  return (function recursive([first, ...rest]: (string | RegExp)[], content: string): NDArray<string> {
    return rest.length ? map(content.split(first), value => recursive(rest, value)) : content.split(first);
  })(separators, content);
}

export function nestedJoin(separators: string[], content: NDArray<string>) {
  return (function recursive(parent: NDArray<string>, axis: number): string {
    return map(parent, value => (isArrayLike(value) ? recursive(value, axis + 1) : value)).join(separators[axis]);
  })(content, 0);
}

export function shape(array: NDArray<unknown>) {
  const shape: number[] = [];
  (function recursive(parent: NDArray<unknown>, axis: number) {
    if (shape.length < axis || shape[axis] < parent.length) shape[axis] = parent.length;
    forEach(parent, value => {
      if (isArrayLike(value)) recursive(value, axis + 1);
    });
  })(array, 0);
  return shape;
}

export function nestedFill<T>(array: NDArray<T>, value: T, startIndices: number[] = [], endIndices: number[] = []) {
  (function recursive(parent: NDArray<T>, axis: number) {
    for (
      let index = toValidIndex(startIndices[axis], parent);
      index < toValidEndIndex(endIndices[axis], parent);
      index++
    ) {
      const original = parent[index];
      if (isArrayLike(original)) recursive(original, axis + 1);
      else parent[index] = value;
    }
  })(array, 0);
  return array;
}

export function nestedFillMap<T>(
  array: NDArray<T>,
  callbackfn: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => T,
  startIndices: number[] = [],
  endIndices: number[] = [],
  thisArg?: any
) {
  (function recursive(parent: NDArray<T>, indices: number[]) {
    for (
      let index = toValidIndex(startIndices[indices.length], parent);
      index < toValidEndIndex(endIndices[indices.length], parent);
      index++
    ) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value)) recursive(value, newIndices);
      else parent[index] = callbackfn.call(thisArg, value, indices.concat(index), array, parent);
    }
  })(array, []);
  return array;
}

export function nestedIncludes<T>(array: NDArray<T>, searchElement: T, fromIndices: number[] = []) {
  return (function recursive(parent: NDArray<T>, axis: number): boolean {
    for (let index = toValidIndex(fromIndices[axis], parent); index < parent.length; index++) {
      const value = parent[index];
      if (isArrayLike(value)) {
        if (recursive(value, axis + 1)) return true;
      } else if (value === searchElement) return true;
    }
    return false;
  })(array, 0);
}

export function nestedIncludesFromLast<T>(array: NDArray<T>, searchElement: T, fromIndices: number[] = []) {
  return (function recursive(parent: NDArray<T>, axis: number): boolean {
    for (let index = toValidLastIndex(fromIndices[axis], parent); index >= 0; index--) {
      const value = parent[index];
      if (isArrayLike(value)) {
        if (recursive(value, axis + 1)) return true;
      } else if (value === searchElement) return true;
    }
    return false;
  })(array, 0);
}

export function nestedIndexOf<T>(array: NDArray<T>, searchElement: T, fromIndices: number[] = []) {
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value)) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (value === searchElement) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

export function nestedLastIndexOf<T>(array: NDArray<T>, searchElement: T, fromIndices: number[] = []) {
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value)) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (value === searchElement) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

export function nestedFind<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, T] {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      if (isArrayLike(value)) {
        const result = recursive(value, indices.concat(index));
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, indices.concat(index), array, parent)) return [true, value];
    }
    return [false];
  })(array, [])[1];
}

export function nestedFindLast<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, T] {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      if (isArrayLike(value)) {
        const result = recursive(value, indices.concat(index));
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, indices.concat(index), array, parent)) return [true, value];
    }
    return [false];
  })(array, [])[1];
}

export function nestedFindIndex<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value)) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

export function nestedFindLastIndex<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value)) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

export function nestedSome<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      if (isArrayLike(value)) {
        if (recursive(value, indices.concat(index))) return true;
      } else if (predicate.call(thisArg, value, indices.concat(index), array, parent)) return true;
    }
    return false;
  })(array, []);
}

export function nestedSomeFromLast<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      if (isArrayLike(value)) {
        if (recursive(value, indices.concat(index))) return true;
      } else if (predicate.call(thisArg, value, indices.concat(index), array, parent)) return true;
    }
    return false;
  })(array, []);
}

export function nestedEvery<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      if (isArrayLike(value)) {
        if (!recursive(value, indices.concat(index))) return false;
      } else if (!predicate.call(thisArg, value, indices.concat(index), array, parent)) return false;
    }
    return true;
  })(array, []);
}

export function nestedEveryFromLast<T>(
  array: NDArray<T>,
  predicate: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  thisArg?: any
) {
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      if (isArrayLike(value)) {
        if (!recursive(value, indices.concat(index))) return false;
      } else if (!predicate.call(thisArg, value, indices.concat(index), array, parent)) return false;
    }
    return true;
  })(array, []);
}
