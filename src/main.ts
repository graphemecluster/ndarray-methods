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

/**
 * Builds a nested array with a specific shape and fills the array with the result of a defined map function.
 * @param array The shape of the array.
 * @param mapfn A function that accepts the coordinates of the element.
 * The `buildShape` method calls the `mapfn` function one time for each position in the array.
 * @param thisArg An object to which the `this` keyword can refer in the `mapfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The array built with the specific shape.
 */
export function buildShape<T, This = undefined>(
  array: number[],
  mapfn: (this: This, ...indices: number[]) => T,
  thisArg?: This
): NDArray<T>;

/**
 * Builds a nested array with a specific shape and fills the array with a static value.
 * @param array The shape of the array.
 * @param value The value to fill the array with.
 * @returns The array built with the specific shape.
 */
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

/**
 * Gets the length of each axis of a nested array. The `shape` method returns the shape at the deepest element.
 * For a non-variable length array, use the `shapeAtOrigin` method instead for a better performance.
 * @param array The original array.
 * @returns A number array containing the lengths of each axis of the array.
 */
export function shape(array: NDArray<unknown>) {
  return (function recursive(parent: NDArray<unknown>, shape: number[]): number[] {
    let newShape = shape;
    forEach(parent, value => {
      if (isArrayLike(value)) {
        const result = recursive(value, shape.concat(value.length));
        if (result.length > newShape.length || result[shape.length] > newShape[shape.length]) newShape = result;
      }
    });
    return newShape;
  })(array, [array.length]);
}

/**
 * Gets the length of each axis of a nested array. The `shapeAtOrigin` method only checks the first element recursively.
 * For a variable length array, use the `shape` method instead to get the shape at the deepest element.
 * @param array The original array.
 * @returns A number array containing the lengths of each axis of the array.
 */
export function shapeAtOrigin(array: NDArray<unknown>) {
  return (function recursive(parent: NDArray<unknown>, shape: number[]): number[] {
    const first = parent[0];
    return isArrayLike(first) ? recursive(first, shape.concat(first.length)) : shape;
  })(array, [array.length]);
}

/**
 * Calls a defined callback function on each element in a nested array, and returns a deeply-cloned array that contains the results.
 * @param array The original array.
 * @param callbackfn A function that accepts up to 4 arguments.
 * The `nestedMap` method calls the `callbackfn` function one time for each element in the array.
 * @param thisArg An object to which the `this` keyword can refer in the `callbackfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The mapped array.
 */
export function nestedMap<T, U, This = undefined>(
  array: NDArray<T>,
  callbackfn: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => U,
  thisArg?: This
): NDArray<U>;

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

/**
 * Performs the specified action for each element in a nested array.
 * @param array The original array.
 * @param callbackfn A function that accepts up to 4 arguments.
 * The `nestedForEach` method calls the `callbackfn` function one time for each element in the array.
 * @param thisArg An object to which the `this` keyword can refer in the `callbackfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 */
export function nestedForEach<T, U, This = undefined>(
  array: NDArray<T>,
  callbackfn: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => U,
  thisArg?: This
): void;

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

/**
 * Splits a string into substrings using the specified separators for each axis and return them as a nested array.
 * @param separators An array of separators to use in separating the string.
 * @param content The string to split.
 * @returns The splitted string as a nested array.
 */
export function nestedSplit(separators: (string | RegExp)[], content: string) {
  assertNonEmpty(separators);
  return (function recursive([first, ...rest]: (string | RegExp)[], content: string): NDArray<string> {
    return rest.length ? map(content.split(first), value => recursive(rest, value)) : content.split(first);
  })(separators, content + "");
}

/**
 * Concatenates all the elements in a nested array into a string, separated by the specified separator strings for each axis.
 * @param separators A string used to separate one element of the array from the next in the resulting string.
 * If a certain separator is `undefined`, a comma (`,`) is used instead for that axis.
 * @param content The array to join.
 * @returns A string with all the elements concatenated.
 */
export function nestedJoin(separators: string[], content: NDArray<string>) {
  return (function recursive(parent: NDArray<string>, axis: number): string {
    return map(parent, value => (isArrayLike(value) ? recursive(value, axis + 1) : value)).join(separators[axis]);
  })(content, 0);
}

/**
 * Changes all elements in a nested array from `startIndices` to `endIndices` to a static value in place and returns the array.
 * @param array The original array.
 * @param value The value to fill the section of the array with.
 * @param startIndices The coordinates to start filling the array at (inclusive).
 * If a certain start index is negative, the length of that axis of the array will be added to it.
 * @param endIndices The coordinates to stop filling the array at (exclusive).
 * If a certain end index is negative, the length of that axis of the array will be added to it.
 * @returns The modified array, which the instance is the same as the original array.
 */
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

/**
 * Calls a defined callback function on all elements in a nested array from `startIndices` to `endIndices` in place and returns the array.
 * If both `startIndices` and `endIndices` are omitted, the result is the same as the `nestedMap` method performed in place.
 * @param array The original array.
 * @param callbackfn A function that accepts up to 4 arguments.
 * The `nestedFillMap` method calls the `callbackfn` function one time for each element in the array.
 * @param startIndices The coordinates to start filling the array at (inclusive).
 * If a certain start index is negative, the length of that axis of the array will be added to it.
 * @param endIndices The coordinates to stop filling the array at (exclusive).
 * If a certain end index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `callbackfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The modified array, which the instance is the same as the original array.
 */
export function nestedFillMap<T, This = undefined>(
  array: NDArray<T>,
  callbackfn: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => T,
  startIndices?: number[],
  endIndices?: number[],
  thisArg?: This
): NDArray<T>;

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

/**
 * Determines whether a nested array includes a specified element, searching forwards.
 * If the element is more likely to appear near the end of the array, use the `nestedIncludesFromLast` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @returns `true` if the element is found in the array, or `false` otherwise.
 */
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

/**
 * Determines whether a nested array includes a specified element, searching backwards.
 * If the element is more likely to appear near the start of the array, use the `nestedIncludes` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @returns `true` if the element is found in the array, or `false` otherwise.
 */
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

/**
 * Returns the coordinates of the first occurrence of a specified value in an array, or `undefined` if it is not present.
 * If the element is more likely to appear near the end of the array, use the `nestedLastIndexOf` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @returns A number array containing the coordinates of the element, or `undefined` if it is not present.
 */
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

/**
 * Returns the coordinates of the last occurrence of a specified value in an array, or `undefined` if it is not present.
 * If the element is more likely to appear near the start of the array, use the `nestedIndexOf` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @returns A number array containing the coordinates of the element, or `undefined` if it is not present.
 */
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

/**
 * Returns the value of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * If the element is more likely to appear near the end of the array, use the `nestedFindLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFind` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFind<T, S extends T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => value is S,
  fromIndices?: number[],
  thisArg?: This
): S | undefined;

/**
 * Returns the value of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * If the element is more likely to appear near the end of the array, use the `nestedFindLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFind` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFind<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): T | undefined;

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

/**
 * Returns the value of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * If the element is more likely to appear near the start of the array, use the `nestedFind` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindLast` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the last element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindLast<T, S extends T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => value is S,
  fromIndices?: number[],
  thisArg?: This
): S | undefined;

/**
 * Returns the value of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * If the element is more likely to appear near the start of the array, use the `nestedFind` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindLast` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the last element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindLast<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): T | undefined;

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

/**
 * Returns the coordinates of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * If the element is more likely to appear near the end of the array, use the `nestedFindLastIndex` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindIndex` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The coordinates of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindIndex<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): number[] | undefined;

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

/**
 * Returns the coordinates of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * If the element is more likely to appear near the start of the array, use the `nestedFindIndex` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindLastIndex` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The coordinates of the last element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindLastIndex<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): number[] | undefined;

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

/**
 * Determines whether at least one element in a nested array satisfies the `predicate` function, searching forwards.
 * If the element is more likely to appear near the end of the array, use the `nestedSomeFromLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedSome` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if at least one element in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedSome<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): boolean;

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

/**
 * Determines whether at least one element in a nested array satisfies the `predicate` function, searching backwards.
 * If the element is more likely to appear near the start of the array, use the `nestedSome` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedSomeFromLast` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if at least one element in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedSomeFromLast<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): boolean;

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

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching forwards.
 * If the counter-element is more likely to appear near the end of the array, use the `nestedEveryFromLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEvery<T, S extends T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => value is S,
  fromIndices?: number[],
  thisArg?: This
): array is NDArray<S>;

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching forwards.
 * If the counter-element is more likely to appear near the end of the array, use the `nestedEveryFromLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEvery<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): boolean;

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

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching backwards.
 * If the counter-element is more likely to appear near the start of the array, use the `nestedEvery` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEveryFromLast<T, S extends T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => value is S,
  fromIndices?: number[],
  thisArg?: This
): array is NDArray<S>;

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching backwards.
 * If the counter-element is more likely to appear near the start of the array, use the `nestedEvery` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEveryFromLast<T, This = undefined>(
  array: NDArray<T>,
  predicate: (this: This, value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices?: number[],
  thisArg?: This
): boolean;

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
