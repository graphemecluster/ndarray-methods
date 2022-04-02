import { Infinity, NDArray, MDArray, BuildIndices, Indices, Shape, Map, ElementType, Parent, Cast, Narrow } from ".";

function call<T, A extends unknown[], R>(method: (this: T, ...args: A) => R): (thisArg: T, ...args: A) => R {
  return (...args) => method.call(...args);
}
const hasOwnProperty: (object: Object, property: PropertyKey) => boolean = call(Object.prototype.hasOwnProperty);
const ArrayPrototype = Array.prototype;
const forEach: <T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any) => void = call(
  ArrayPrototype.forEach
);
const map: <T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any) => U[] = call(
  ArrayPrototype.map
);
const ArrayPrototypeReduce: <T, U>(
  this: T[],
  callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
  initialValue?: U
) => U = ArrayPrototype.reduce;
const reduce: <T, U>(
  array: T[],
  callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
  initialValue?: U
) => U = call(ArrayPrototypeReduce);

function isCallable(item: unknown): item is Function {
  try {
    forEach([], item as never);
    return true;
  } catch {
    return false;
  }
}
function hasLengthProperty(item: Object): item is ArrayLike<unknown> {
  return hasOwnProperty(item, "length");
}
function isArrayLike(item: unknown): item is unknown[] {
  if (Array.isArray(item)) return true;
  if (!item || typeof item !== "object" || !hasLengthProperty(item) || typeof item.length !== "number") return false;
  return !item.length || (item.length > 0 && hasOwnProperty(item, item.length - 1));
}
function assertNonEmpty(array: unknown[]) {
  if (!array.length) throw new RangeError("The length of the array must not be zero");
}
function assertPositive(depth: number) {
  if (depth < 1) throw new RangeError("maxDepth argument must be at least 1");
  return Math.floor(depth);
}

function toValidIndex(index: number | undefined, array: unknown[]) {
  if (typeof index === "undefined" || index === -Infinity) return 0;
  return index >= 0 ? ~~index : Math.max(array.length + ~~index, 0);
}
function toValidLastIndex(index: number | undefined, array: unknown[]) {
  if (typeof index === "undefined" || index === Infinity) return array.length - 1;
  return index >= 0 ? Math.min(~~index, array.length - 1) : array.length + ~~index;
}
function toValidEndIndex(index: number | undefined, array: unknown[]) {
  if (typeof index === "undefined" || index === Infinity) return array.length;
  return index >= 0 ? Math.min(~~index, array.length) : array.length + ~~index;
}

/**
 * Builds a nested array with a specific shape and fills the array with the result of a defined map function.
 * ```js
 * [2, 3].buildShape((x, y) => x * 3 + y); // [[0, 1, 2], [3, 4, 5]]
 * ```
 * @param array The shape of the array.
 * @param mapfn A function that accepts the coordinates of the element.
 * The `buildShape` method calls the `mapfn` function one time for each position in the array.
 * @param thisArg An object to which the `this` keyword can refer in the `mapfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The array built with the specific shape.
 */
export function buildShape<A extends readonly number[], T, This = undefined>(
  array: Narrow<A>,
  mapfn: (this: This, ...indices: BuildIndices<A>) => T,
  thisArg?: Narrow<This>
): MDArray<T, A>;

/**
 * Builds a nested array with a specific shape and fills the array with a static value.
 * ```js
 * [2, 3].buildShape(10); // [[10, 10, 10], [10, 10, 10]]
 * ```
 * @param array The shape of the array.
 * @param value The value to fill the array with.
 * @returns The array built with the specific shape.
 */
export function buildShape<A extends readonly number[], T>(array: Narrow<A>, value: T): MDArray<T, A>;

export function buildShape<T>(array: number[], valueOrMapfn: T | ((...indices: number[]) => T), thisArg?: any) {
  assertNonEmpty(array);
  return isCallable(valueOrMapfn)
    ? (function recursive([length, ...rest]: number[], mapfn: (...indices: number[]) => T): NDArray<T> {
        return Array.from<unknown, T | NDArray<T>>(
          { length },
          rest.length
            ? (_, index) => recursive(rest, (...indices) => mapfn(index, ...indices))
            : (_, index) => mapfn.call(thisArg, index)
        );
      })(array, valueOrMapfn)
    : (function recursive([length, ...rest]: number[], value: T): NDArray<T> {
        return Array.from<unknown, T | NDArray<T>>(
          { length },
          rest.length ? () => recursive(rest, value) : () => value
        );
      })(array, valueOrMapfn);
}

/**
 * Gets the length of each axis of a nested array. The `shape` method returns the shape at the deepest element.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].shape(); // [2, 3]
 * [[0, 1], [2, [3, 4], 5]].shape(); // [2, 3, 2]
 * ```
 * For a non-variable length array, use the `shapeAtOrigin` method instead for a better performance.
 * @param array The original array.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns A number array containing the lengths of each axis of the array.
 */
export function shape<A extends readonly unknown[], M extends number = Infinity>(
  array: A,
  maxDepth?: Narrow<M>
): Shape<A, M>;

export function shape(array: NDArray<unknown>, maxDepth = Infinity) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<unknown>, shape: number[]): number[] {
    return reduce(
      parent,
      (newShape, value) => {
        if (isArrayLike(value) && shape.length < maxDepth) {
          const result = recursive(value, shape.concat(value.length));
          if (result.length > newShape.length || result[shape.length] > newShape[shape.length]) return result;
        }
        return newShape;
      },
      shape
    );
  })(array, [array.length]);
}

/**
 * Gets the length of each axis of a nested array. The `shapeAtOrigin` method only checks the first element recursively.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].shapeAtOrigin(); // [2, 3]
 * [[0, 1], [2, [3, 4], 5]].shapeAtOrigin(); // [2, 2]
 * ```
 * For a variable length array, use the `shape` method instead to get the shape at the deepest element.
 * @param array The original array.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns A number array containing the lengths of each axis of the array.
 */
export function shapeAtOrigin<A extends readonly unknown[], M extends number = Infinity>(
  array: A,
  maxDepth?: Narrow<M>
): Shape<A, M>;

export function shapeAtOrigin(array: NDArray<unknown>, maxDepth = Infinity) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive([first]: NDArray<unknown>, shape: number[]): number[] {
    return isArrayLike(first) && shape.length < maxDepth ? recursive(first, shape.concat(first.length)) : shape;
  })(array, [array.length]);
}

/**
 * Calls a defined callback function on each element in a nested array, and returns a deeply-cloned array that contains the results.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedMap(n => n + 10); // [[10, 11, 12], [13, 14, 15]]
 * ```
 * @param array The original array.
 * @param callbackfn A function that accepts up to 4 arguments.
 * The `nestedMap` method calls the `callbackfn` function one time for each element in the array.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `callbackfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The mapped array.
 */
export function nestedMap<A extends readonly unknown[], U, M extends number = Infinity, This = undefined>(
  array: A,
  callbackfn: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => U,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): Map<A, U, M>;

export function nestedMap<T, U>(
  array: NDArray<T>,
  callbackfn: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => U,
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): NDArray<U> {
    return map(parent, (value, index) => {
      const newIndices = indices.concat(index);
      return isArrayLike(value) && newIndices.length < maxDepth
        ? recursive(value, newIndices)
        : callbackfn.call(thisArg, value, newIndices, array, parent);
    });
  })(array, []);
}

/**
 * Performs the specified action for each element in a nested array.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedForEach(n => console.log(n)); // Prints 0 to 5
 * ```
 * @param array The original array.
 * @param callbackfn A function that accepts up to 4 arguments.
 * The `nestedForEach` method calls the `callbackfn` function one time for each element in the array.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `callbackfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 */
export function nestedForEach<A extends readonly unknown[], U, M extends number = Infinity, This = undefined>(
  array: A,
  callbackfn: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => U,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): void;

export function nestedForEach<T>(
  array: NDArray<T>,
  callbackfn: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => void,
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  (function recursive(parent: NDArray<T>, indices: number[]) {
    forEach(parent, (value, index) => {
      const newIndices = indices.concat(index);
      isArrayLike(value) && newIndices.length < maxDepth
        ? recursive(value, newIndices)
        : callbackfn.call(thisArg, value, newIndices, array, parent);
    });
  })(array, []);
}

/**
 * Splits a string into substrings using the specified separators for each axis and return them as a nested array.
 * ```js
 * [/,|;/, ""].nestedSplit("AB,CD;EF"); // [["A", "B"], ["C", "D"], ["E", "F"]]
 * ```
 * @param separators An array of separators to use in separating the string.
 * @param content The string to split.
 * @returns The splitted string as a nested array.
 */
export function nestedSplit<A extends readonly (string | RegExp)[]>(
  separators: Narrow<A>,
  content: string
): MDArray<string, A>;

export function nestedSplit(separators: (string | RegExp)[], content: string) {
  assertNonEmpty(separators);
  return (function recursive([first, ...rest]: (string | RegExp)[], content: string): NDArray<string> {
    return rest.length ? map(content.split(first), value => recursive(rest, value)) : content.split(first);
  })(separators, content + "");
}

/**
 * Concatenates all the elements in a nested array into a string, separated by the specified separator strings for each axis.
 * ```js
 * [",", ""].nestedJoin([[0, 1, 2], [3, 4, 5]]); // "012,345"
 * ```
 * @param separators A string used to separate one element of the array from the next in the resulting string.
 * If a certain separator is `undefined`, a comma (`,`) is used instead for that axis.
 * @param content The array to join.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns A string with all the elements concatenated.
 */
export function nestedJoin<A extends readonly string[]>(
  separators: Narrow<A>,
  content: MDArray<unknown, A>,
  maxDepth?: number
): string;

export function nestedJoin(separators: string[], content: NDArray<unknown>, maxDepth = Infinity) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<unknown>, axis: number): string {
    return map(parent, value => (isArrayLike(value) && axis + 1 < maxDepth ? recursive(value, axis + 1) : value)).join(
      separators[axis]
    );
  })(content, 0);
}

/**
 * Changes all elements in a nested array from `startIndices` to `endIndices` to a static value in place and returns the array.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFill(10); // [[10, 10, 10], [10, 10, 10]]
 * [[0, 1, 2], [3, 4, 5]].nestedFill(10, [0, 0], [2, 2]); // [[10, 10, 2], [10, 10, 5]]
 * ```
 * If both `startIndices` and `endIndices` are omitted, all the elements will be replaced to the specified value.
 * @param array The original array.
 * @param value The value to fill the section of the array with.
 * @param startIndices The coordinates to start filling the array at (inclusive).
 * If a certain start index is negative, the length of that axis of the array will be added to it.
 * @param endIndices The coordinates to stop filling the array at (exclusive).
 * If a certain end index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns The modified array, which the instance is the same as the original array.
 */
export function nestedFill<A extends unknown[], M extends number = Infinity>(
  array: A,
  value: ElementType<A, M>,
  startIndices?: Indices<A, M>,
  endIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>
): A;

export function nestedFill<T>(
  array: NDArray<T>,
  value: T,
  startIndices: number[] = [],
  endIndices: number[] = [],
  maxDepth = Infinity
) {
  maxDepth = assertPositive(maxDepth);
  (function recursive(parent: NDArray<T>, axis: number) {
    for (
      let index = toValidIndex(startIndices[axis], parent);
      index < toValidEndIndex(endIndices[axis], parent);
      index++
    ) {
      const original = parent[index];
      if (isArrayLike(original) && axis + 1 < maxDepth) recursive(original, axis + 1);
      else parent[index] = value;
    }
  })(array, 0);
  return array;
}

/**
 * Calls a defined callback function on all elements in a nested array from `startIndices` to `endIndices` in place and returns the array.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFillMap(n => n + 10); // [[10, 11, 12], [13, 14, 15]]
 * [[0, 1, 2], [3, 4, 5]].nestedFillMap(n => n + 10, [0, 0], [2, 2]); // [[10, 11, 2], [13, 14, 5]]
 * ```
 * If both `startIndices` and `endIndices` are omitted, the result is the same as the `nestedMap` method performed in place.
 * @param array The original array.
 * @param callbackfn A function that accepts up to 4 arguments.
 * The `nestedFillMap` method calls the `callbackfn` function one time for each element in the array.
 * @param startIndices The coordinates to start filling the array at (inclusive).
 * If a certain start index is negative, the length of that axis of the array will be added to it.
 * @param endIndices The coordinates to stop filling the array at (exclusive).
 * If a certain end index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `callbackfn` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The modified array, which the instance is the same as the original array.
 */
export function nestedFillMap<A extends unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  callbackfn: (
    this: This,
    value: ElementType<A, M>,
    indices: Indices<A, M>,
    array: A,
    parent: Parent<A, M>
  ) => ElementType<A, M>,
  startIndices?: Indices<A, M>,
  endIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): A;

export function nestedFillMap<T>(
  array: NDArray<T>,
  callbackfn: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => T,
  startIndices: number[] = [],
  endIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  (function recursive(parent: NDArray<T>, indices: number[]) {
    for (
      let index = toValidIndex(startIndices[indices.length], parent);
      index < toValidEndIndex(endIndices[indices.length], parent);
      index++
    ) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) recursive(value, newIndices);
      else parent[index] = callbackfn.call(thisArg, value, newIndices, array, parent);
    }
  })(array, []);
  return array;
}

/**
 * Determines whether a nested array includes a specified element, searching forwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedIncludes(3); // true
 * [[0, 1, 2], [3, 4, 5]].nestedIncludes(3, [0, 1]); // false
 * ```
 * If the element is more likely to appear near the end of the array, use the `nestedIncludesFromLast` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns `true` if the element is found in the array, or `false` otherwise.
 */
export function nestedIncludes<A extends readonly unknown[], M extends number = Infinity>(
  array: A,
  searchElement: ElementType<A, M>,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>
): boolean;

export function nestedIncludes<T>(
  array: NDArray<T>,
  searchElement: T,
  fromIndices: number[] = [],
  maxDepth = Infinity
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, axis: number): boolean {
    for (let index = toValidIndex(fromIndices[axis], parent); index < parent.length; index++) {
      const value = parent[index];
      if (isArrayLike(value) && axis + 1 < maxDepth) {
        if (recursive(value, axis + 1)) return true;
      } else if (value === searchElement) return true;
    }
    return false;
  })(array, 0);
}

/**
 * Determines whether a nested array includes a specified element, searching backwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedIncludesFromLast(2); // true
 * [[0, 1, 2], [3, 4, 5]].nestedIncludesFromLast(2, [1, 1]); // false
 * ```
 * If the element is more likely to appear near the start of the array, use the `nestedIncludes` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns `true` if the element is found in the array, or `false` otherwise.
 */
export function nestedIncludesFromLast<A extends readonly unknown[], M extends number = Infinity>(
  array: A,
  searchElement: ElementType<A, M>,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>
): boolean;

export function nestedIncludesFromLast<T>(
  array: NDArray<T>,
  searchElement: T,
  fromIndices: number[] = [],
  maxDepth = Infinity
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, axis: number): boolean {
    for (let index = toValidLastIndex(fromIndices[axis], parent); index >= 0; index--) {
      const value = parent[index];
      if (isArrayLike(value) && axis + 1 < maxDepth) {
        if (recursive(value, axis + 1)) return true;
      } else if (value === searchElement) return true;
    }
    return false;
  })(array, 0);
}

/**
 * Returns the coordinates of the first occurrence of a specified value in an array, or `undefined` if it is not present.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedIndexOf(3); // [1, 0]
 * [[0, 1, 2], [3, 4, 5]].nestedIndexOf(3, [0, 1]); // undefined
 * ```
 * If the element is more likely to appear near the end of the array, use the `nestedLastIndexOf` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns A number array containing the coordinates of the element, or `undefined` if it is not present.
 */
export function nestedIndexOf<A extends readonly unknown[], M extends number = Infinity>(
  array: A,
  searchElement: ElementType<A, M>,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>
): Indices<A, M> | undefined;

export function nestedIndexOf<T>(array: NDArray<T>, searchElement: T, fromIndices: number[] = [], maxDepth = Infinity) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (value === searchElement) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

/**
 * Returns the coordinates of the last occurrence of a specified value in an array, or `undefined` if it is not present.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedLastIndexOf(2); // [0, 2]
 * [[0, 1, 2], [3, 4, 5]].nestedLastIndexOf(2, [1, 1]); // undefined
 * ```
 * If the element is more likely to appear near the start of the array, use the `nestedIndexOf` method instead for a better performance.
 * @param array The original array.
 * @param searchElement The element to search for.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @returns A number array containing the coordinates of the element, or `undefined` if it is not present.
 */
export function nestedLastIndexOf<A extends readonly unknown[], M extends number = Infinity>(
  array: A,
  searchElement: ElementType<A, M>,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>
): Indices<A, M> | undefined;

export function nestedLastIndexOf<T>(
  array: NDArray<T>,
  searchElement: T,
  fromIndices: number[] = [],
  maxDepth = Infinity
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (value === searchElement) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

/**
 * Returns the value of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3); // 3
 * [[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3, [0, 1]); // undefined
 * ```
 * If the element is more likely to appear near the end of the array, use the `nestedFindLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFind` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFind<
  A extends readonly unknown[],
  S extends ElementType<A, M>,
  M extends number = Infinity,
  This = undefined
>(
  array: A,
  predicate: (
    this: This,
    value: ElementType<A, M>,
    indices: Indices<A, M>,
    array: A,
    parent: Parent<A, M>
  ) => value is S,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): S | undefined;

/**
 * Returns the value of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3); // 3
 * [[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3, [0, 1]); // undefined
 * ```
 * If the element is more likely to appear near the end of the array, use the `nestedFindLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFind` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFind<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): ElementType<A, M> | undefined;

export function nestedFind<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, T | NDArray<T>] {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return [true, value];
    }
    return [false];
  })(array, [])[1];
}

/**
 * Returns the value of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFindLast(n => n % 6 == 2); // 2
 * [[0, 1, 2], [3, 4, 5]].nestedFindLast(n => n % 6 == 2, [1, 1]); // undefined
 * ```
 * If the element is more likely to appear near the start of the array, use the `nestedFind` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindLast` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the last element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindLast<
  A extends readonly unknown[],
  S extends ElementType<A, M>,
  M extends number = Infinity,
  This = undefined
>(
  array: A,
  predicate: (
    this: This,
    value: ElementType<A, M>,
    indices: Indices<A, M>,
    array: A,
    parent: Parent<A, M>
  ) => value is S,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): S | undefined;

/**
 * Returns the value of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFindLast(n => n % 6 == 2); // 2
 * [[0, 1, 2], [3, 4, 5]].nestedFindLast(n => n % 6 == 2, [1, 1]); // undefined
 * ```
 * If the element is more likely to appear near the start of the array, use the `nestedFind` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindLast` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The value of the last element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindLast<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): ElementType<A, M> | undefined;

export function nestedFindLast<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, T | NDArray<T>] {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return [true, value];
    }
    return [false];
  })(array, [])[1];
}

/**
 * Returns the coordinates of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFindIndex(n => n % 6 == 3); // [1, 0]
 * [[0, 1, 2], [3, 4, 5]].nestedFindIndex(n => n % 6 == 3, [0, 1]); // undefined
 * ```
 * If the element is more likely to appear near the end of the array, use the `nestedFindLastIndex` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindIndex` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The coordinates of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindIndex<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): Indices<A, M> | undefined;

export function nestedFindIndex<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

/**
 * Returns the coordinates of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedFindLastIndex(n => n % 6 == 2); // [0, 2]
 * [[0, 1, 2], [3, 4, 5]].nestedFindLastIndex(n => n % 6 == 2, [1, 1]); // undefined
 * ```
 * If the element is more likely to appear near the start of the array, use the `nestedFindIndex` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedFindLastIndex` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns The coordinates of the last element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.
 */
export function nestedFindLastIndex<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): Indices<A, M> | undefined;

export function nestedFindLastIndex<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        const result = recursive(value, newIndices);
        if (result[0]) return result;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return [true, newIndices];
    }
    return [false];
  })(array, [])[1];
}

/**
 * Determines whether at least one element in a nested array satisfies the `predicate` function, searching forwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedSome(n => n % 6 == 3); // true
 * [[0, 1, 2], [3, 4, 5]].nestedSome(n => n % 6 == 3, [0, 1]); // false
 * ```
 * If the element is more likely to appear near the end of the array, use the `nestedSomeFromLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedSome` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if at least one element in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedSome<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): boolean;

export function nestedSome<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        if (recursive(value, newIndices)) return true;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return true;
    }
    return false;
  })(array, []);
}

/**
 * Determines whether at least one element in a nested array satisfies the `predicate` function, searching backwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedSomeFromLast(n => n % 6 == 2); // true
 * [[0, 1, 2], [3, 4, 5]].nestedSomeFromLast(n => n % 6 == 2, [1, 1]); // false
 * ```
 * If the element is more likely to appear near the start of the array, use the `nestedSome` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedSomeFromLast` method calls the `predicate` function one time for each element in the array until it returns a truthy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if at least one element in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedSomeFromLast<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): boolean;

export function nestedSomeFromLast<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        if (recursive(value, newIndices)) return true;
      } else if (predicate.call(thisArg, value, newIndices, array, parent)) return true;
    }
    return false;
  })(array, []);
}

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching forwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3); // false
 * [[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3, [0, 1]); // true
 * ```
 * If the counter-element is more likely to appear near the end of the array, use the `nestedEveryFromLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEvery<
  A extends readonly unknown[],
  S extends ElementType<A, M>,
  M extends number = Infinity,
  This = undefined
>(
  array: A,
  predicate: (
    this: This,
    value: ElementType<A, M>,
    indices: Indices<A, M>,
    array: A,
    parent: Parent<A, M>
  ) => value is S,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): array is Cast<Map<A, S, M>, A>;

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching forwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3); // false
 * [[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3, [0, 1]); // true
 * ```
 * If the counter-element is more likely to appear near the end of the array, use the `nestedEveryFromLast` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEvery<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): boolean;

export function nestedEvery<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidIndex(fromIndices[indices.length], parent); index < parent.length; index++) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        if (!recursive(value, newIndices)) return false;
      } else if (!predicate.call(thisArg, value, newIndices, array, parent)) return false;
    }
    return true;
  })(array, []);
}

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching backwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedEveryFromLast(n => n % 6 != 2); // false
 * [[0, 1, 2], [3, 4, 5]].nestedEveryFromLast(n => n % 6 != 2, [1, 1]); // true
 * ```
 * If the counter-element is more likely to appear near the start of the array, use the `nestedEvery` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEveryFromLast<
  A extends readonly unknown[],
  S extends ElementType<A, M>,
  M extends number = Infinity,
  This = undefined
>(
  array: A,
  predicate: (
    this: This,
    value: ElementType<A, M>,
    indices: Indices<A, M>,
    array: A,
    parent: Parent<A, M>
  ) => value is S,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): array is Cast<Map<A, S, M>, A>;

/**
 * Determines whether all elements in a nested array satisfies the `predicate` function, searching backwards.
 * ```js
 * [[0, 1, 2], [3, 4, 5]].nestedEveryFromLast(n => n % 6 != 2); // false
 * [[0, 1, 2], [3, 4, 5]].nestedEveryFromLast(n => n % 6 != 2, [1, 1]); // true
 * ```
 * If the counter-element is more likely to appear near the start of the array, use the `nestedEvery` method instead for a better performance.
 * @param array The original array.
 * @param predicate A function that accepts up to 4 arguments.
 * The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value.
 * @param fromIndices The coordinates at which to begin searching for (inclusive).
 * If a certain index is negative, the length of that axis of the array will be added to it.
 * @param maxDepth The deepest axis the method will traverse. Defaults to `Infinity`.
 * @param thisArg An object to which the `this` keyword can refer in the `predicate` function.
 * If `thisArg` is omitted, `undefined` is used as the `this` value.
 * @returns `true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.
 */
export function nestedEveryFromLast<A extends readonly unknown[], M extends number = Infinity, This = undefined>(
  array: A,
  predicate: (this: This, value: ElementType<A, M>, indices: Indices<A, M>, array: A, parent: Parent<A, M>) => unknown,
  fromIndices?: Indices<A, M>,
  maxDepth?: Narrow<M>,
  thisArg?: Narrow<This>
): boolean;

export function nestedEveryFromLast<T>(
  array: NDArray<T>,
  predicate: (value: T | NDArray<T>, indices: number[], array: NDArray<T>, parent: NDArray<T>) => unknown,
  fromIndices: number[] = [],
  maxDepth = Infinity,
  thisArg?: any
) {
  maxDepth = assertPositive(maxDepth);
  return (function recursive(parent: NDArray<T>, indices: number[]): boolean {
    for (let index = toValidLastIndex(fromIndices[indices.length], parent); index >= 0; index--) {
      const value = parent[index];
      const newIndices = indices.concat(index);
      if (isArrayLike(value) && newIndices.length < maxDepth) {
        if (!recursive(value, newIndices)) return false;
      } else if (!predicate.call(thisArg, value, newIndices, array, parent)) return false;
    }
    return true;
  })(array, []);
}
