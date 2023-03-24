# ndarray-methods

[![npm](https://img.shields.io/npm/v/ndarray-methods)](https://www.npmjs.com/package/ndarray-methods) [![types](https://img.shields.io/npm/types/ndarray-methods)](https://www.npmjs.com/package/ndarray-methods) [![license](https://img.shields.io/npm/l/ndarray-methods)](https://www.npmjs.com/package/ndarray-methods)

Convenient methods for JavaScript built-in multi-dimensional arrays.

Zero dependencies. Written in TypeScript.

## Installation

```shell
npm install ndarray-methods
```

### Via CDN

#### Library Style

```html
<script src="https://unpkg.com/ndarray-methods@1.2.1/dist/index.js" defer></script>
```

#### Polyfill Style

```html
<script src="https://unpkg.com/ndarray-methods@1.2.1/dist/polyfill.js" defer></script>
```

> ## Warning
>
> The use of monkey-patching packages is discouraged by TC39 as it may cause web compatibility issues.
> It is recommended not to use the polyfill style until the related proposal reaches Stage 1 in the TC39 process.
> See the [Notes](#notes) Section below for more details.

If you use TypeScript, version 1.3.0 requires TypeScript 5.0 or above for the `const` type parameter modifiers to work.
Otherwise, use version 1.2.1.

### Using NDArray

#### Library Style

<!-- prettier-ignore -->
```js
import NDArray from "ndarray-methods";

function levenshteinDistance(s, t) {
  return NDArray.nestedFillMap(
    NDArray.buildShape(
      [s.length + 1, t.length + 1],
      (i, j) => +!(i && j) && (i || j)
    ),
    (_, [i, j], d) => Math.min(
      d[i - 1][j] + 1,
      d[i][j - 1] + 1,
      d[i - 1][j - 1] + (s[i - 1] != t[j - 1])
    ),
    [1, 1]
  )[s.length][t.length];
}

levenshteinDistance("kitten", "sitting"); // 3
```

#### Polyfill Style

To use the library as a "polyfill" on `Array.prototype`:

<!-- prettier-ignore -->
```js
import "ndarray-methods/polyfill";

function levenshteinDistance(s, t) {
  return [s.length + 1, t.length + 1]
    .buildShape((i, j) => +!(i && j) && (i || j))
    .nestedFillMap(
      (_, [i, j], d) => Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (s[i - 1] != t[j - 1])
      ),
      [1, 1]
    )[s.length][t.length];
}

levenshteinDistance("kitten", "sitting"); // 3
```

## Type Inferring

If you are using the polyfill style, it is recommended that you use a `tuple()` utility function while handling with shape or coordinates (or TypeScript's `as const`, whatever you want) to infer the more accurate type especially when using TypeScript:

<!-- prettier-ignore -->
```js
[3, 4, 5].buildShape(0); // Inferred type: NDArray<number>
tuple(3, 4, 5).buildShape(0); // Inferred type: number[][][]
```

To define the `tuple()` function:

<!-- prettier-ignore -->
```ts
function tuple<T extends unknown[]>(...args: T) { return args; }
```

Or if you're not using TypeScript:

<!-- prettier-ignore -->
```js
/** @type { <T extends unknown[]>(...args: T) => T } */
function tuple(...args) { return args; }
```

Alternatively, the static `fromShape`, `nestedSplit` and `nestedJoin` methods are available on the `Array` constructor starting from version 1.2.1, and they are equivalent to calling the `buildShape`, `nestedSplit` and `nestedJoin` methods on the `Array.prototype` with `.call()`.

## Notes

- This library is intended to extend the built-in `Array.prototype` (because it may become a library for demonstration for the planned ECMAScript Proposal), so many methods are prefixed with the word `nested`.

- The documentation is written based on the declaration files of the core library, so as to keep the wording consistent with the ECMAScript specification.

- The types in the documentation are wide; you should get narrower types when you are writing codes.

<!-- prettier-ignore-start -->
# Documentation

## Table of Contents

- [buildShape](#buildshape)
- [shape, shapeAtOrigin](#shape-shapeatorigin)
- [nestedMap](#nestedmap)
- [nestedForEach](#nestedforeach)
- [nestedSplit](#nestedsplit)
- [nestedJoin](#nestedjoin)
- [nestedFill](#nestedfill)
- [nestedFillMap](#nestedfillmap)
- [nestedIncludes, nestedIncludesFromLast](#nestedincludes-nestedincludesfromlast)
- [nestedIndexOf, nestedLastIndexOf](#nestedindexof-nestedlastindexof)
- [nestedFind, nestedFindLast](#nestedfind-nestedfindlast)
- [nestedFindIndex, nestedFindLastIndex](#nestedfindindex-nestedfindlastindex)
- [nestedSome, nestedSomeFromLast](#nestedsome-nestedsomefromlast)
- [nestedEvery, nestedEveryFromLast](#nestedevery-nestedeveryfromlast)

## Methods

### buildShape

▸ `array`<`T`\>.**buildShape**(`mapfn`, `thisArg?`): `NDArray`<`T`\>

Builds a nested array with a specific shape and fills the array with the result of a defined map function.

```js
[2, 3].buildShape((x, y) => x * 3 + y); // [[0, 1, 2], [3, 4, 5]]
```

**Alias** (_only available on the `Array` constructor when using polyfill style_)

▸ Array.**buildShape**(`array`<`T`\>, `mapfn`, `thisArg?`): `NDArray`<`T`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `number`[] | The shape of the array. |
| `mapfn` | (...`indices`: `number`[]) => `T` | A function that accepts the coordinates of the element. The `buildShape` method calls the `mapfn` function one time for each position in the array. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `mapfn` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`NDArray`<`T`\>

The array built with the specific shape.

___

▸ `array`<`T`\>.**buildShape**(`value`): `NDArray`<`T`\>

Builds a nested array with a specific shape and fills the array with a static value.

```js
[2, 3].buildShape(10); // [[10, 10, 10], [10, 10, 10]]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `number`[] | The shape of the array. |
| `value` | `T` | The value to fill the array with. |

#### Returns

`NDArray`<`T`\>

The array built with the specific shape.

___

### shape, shapeAtOrigin

▸ `array`.**shape**(`maxDepth?`): `number`[]

Gets the length of each axis of a nested array. The `shape` method returns the shape at the deepest element.

```js
[[0, 1, 2], [3, 4, 5]].shape(); // [2, 3]
[[0, 1], [2, [3, 4], 5]].shape(); // [2, 3, 2]
```

▸ `array`.**shapeAtOrigin**(`maxDepth?`): `number`[]

Gets the length of each axis of a nested array. The `shapeAtOrigin` method only checks the first element recursively.

```js
[[0, 1, 2], [3, 4, 5]].shapeAtOrigin(); // [2, 3]
[[0, 1], [2, [3, 4], 5]].shapeAtOrigin(); // [2, 2]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`unknown`\> | The original array. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |

#### Returns

`number`[]

A number array containing the lengths of each axis of the array.

___

### nestedMap

▸ `array`<`T`\>.**nestedMap**<`U`\>(`callbackfn`, `maxDepth?`, `thisArg?`): `NDArray`<`U`\>

Calls a defined callback function on each element in a nested array, and returns a deeply-cloned array that contains the results.

```js
[[0, 1, 2], [3, 4, 5]].nestedMap(n => n + 10); // [[10, 11, 12], [13, 14, 15]]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `callbackfn` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `U` | A function that accepts up to 4 arguments. The `nestedMap` method calls the `callbackfn` function one time for each element in the array. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `callbackfn` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`NDArray`<`U`\>

The mapped array.

___

### nestedForEach

▸ `array`<`T`\>.**nestedForEach**<`U`\>(`callbackfn`, `maxDepth?`, `thisArg?`): `void`

Performs the specified action for each element in a nested array.

```js
[[0, 1, 2], [3, 4, 5]].nestedForEach(n => console.log(n)); // Prints 0 to 5
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `callbackfn` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `U` | A function that accepts up to 4 arguments. The `nestedForEach` method calls the `callbackfn` function one time for each element in the array. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `callbackfn` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

### nestedSplit

▸ `separators`.**nestedSplit**(`content`): `NDArray`<`string`\>

Splits a string into substrings using the specified separators for each axis and return them as a nested array.

```js
[/,|;/, ""].nestedSplit("AB,CD;EF"); // [["A", "B"], ["C", "D"], ["E", "F"]]
```

**Alias** (_only available on the `Array` constructor when using polyfill style_)

▸ Array.**nestedSplit**(`separators`, `content`): `NDArray`<`string`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `separators` | (`string` \| `RegExp`)[] | An array of separators to use in separating the string. |
| `content` | `string` | The string to split. |

#### Returns

`NDArray`<`string`\>

The splitted string as a nested array.

___

### nestedJoin

▸ `separators`.**nestedJoin**(`content`, `maxDepth?`): `string`

Concatenates all the elements in a nested array into a string, separated by the specified separator strings for each axis.

```js
[",", ""].nestedJoin([[0, 1, 2], [3, 4, 5]]); // "012,345"
```

**Alias** (_only available on the `Array` constructor when using polyfill style_)

▸ Array.**nestedJoin**(`separators`, `content`, `maxDepth?`): `string`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `separators` | `string`[] | A string used to separate one element of the array from the next in the resulting string. If a certain separator is `undefined`, a comma (`,`) is used instead for that axis. |
| `content` | `NDArray`<`unknown`\> | The array to join. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |

#### Returns

`string`

A string with all the elements concatenated.

___

### nestedFill

▸ `array`<`T`\>.**nestedFill**(`value`, `startIndices?`, `endIndices?`, `maxDepth?`): `NDArray`<`T`\>

Changes all elements in a nested array from `startIndices` to `endIndices` to a static value in place and returns the array.

```js
[[0, 1, 2], [3, 4, 5]].nestedFill(10); // [[10, 10, 10], [10, 10, 10]]
[[0, 1, 2], [3, 4, 5]].nestedFill(10, [0, 0], [2, 2]); // [[10, 10, 2], [10, 10, 5]]
```

If both `startIndices` and `endIndices` are omitted, all the elements will be replaced to the specified value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `value` | `T` | The value to fill the section of the array with. |
| `startIndices?` | `number`[] | The coordinates to start filling the array at (inclusive). If a certain start index is negative, the length of that axis of the array will be added to it. |
| `endIndices?` | `number`[] | The coordinates to stop filling the array at (exclusive). If a certain end index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |

#### Returns

`NDArray`<`T`\>

The modified array, which the instance is the same as the original array.

___

### nestedFillMap

▸ `array`<`T`\>.**nestedFillMap**(`callbackfn`, `startIndices?`, `endIndices?`, `maxDepth?`, `thisArg?`): `NDArray`<`T`\>

Calls a defined callback function on all elements in a nested array from `startIndices` to `endIndices` in place and returns the array.

```js
[[0, 1, 2], [3, 4, 5]].nestedFillMap(n => n + 10); // [[10, 11, 12], [13, 14, 15]]
[[0, 1, 2], [3, 4, 5]].nestedFillMap(n => n + 10, [0, 0], [2, 2]); // [[10, 11, 2], [13, 14, 5]]
```

If both `startIndices` and `endIndices` are omitted, the result is the same as the `nestedMap` method performed in place.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `callbackfn` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `T` | A function that accepts up to 4 arguments. The `nestedFillMap` method calls the `callbackfn` function one time for each element in the array. |
| `startIndices?` | `number`[] | The coordinates to start filling the array at (inclusive). If a certain start index is negative, the length of that axis of the array will be added to it. |
| `endIndices?` | `number`[] | The coordinates to stop filling the array at (exclusive). If a certain end index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `callbackfn` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`NDArray`<`T`\>

The modified array, which the instance is the same as the original array.

___

### nestedIncludes, nestedIncludesFromLast

▸ `array`<`T`\>.**nestedIncludes**(`searchElement`, `fromIndices?`, `maxDepth?`): `boolean`

Determines whether a nested array includes a specified element, searching forwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedIncludes(3); // true
[[0, 1, 2], [3, 4, 5]].nestedIncludes(3, [0, 1]); // false
```

▸ `array`<`T`\>.**nestedIncludesFromLast**(`searchElement`, `fromIndices?`, `maxDepth?`): `boolean`

Determines whether a nested array includes a specified element, searching backwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedIncludesFromLast(2); // true
[[0, 1, 2], [3, 4, 5]].nestedIncludesFromLast(2, [1, 1]); // false
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `searchElement` | `T` | The element to search for. |
| `fromIndices?` | `number`[] | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |

#### Returns

`boolean`

`true` if the element is found in the array, or `false` otherwise.

___

### nestedIndexOf, nestedLastIndexOf

▸ `array`<`T`\>.**nestedIndexOf**(`searchElement`, `fromIndices?`, `maxDepth?`): `number`[] \| `undefined`

Returns the coordinates of the first occurrence of a specified value in an array, or `undefined` if it is not present.

```js
[[0, 1, 2], [3, 4, 5]].nestedIndexOf(3); // [1, 0]
[[0, 1, 2], [3, 4, 5]].nestedIndexOf(3, [0, 1]); // undefined
```

▸ `array`<`T`\>.**nestedLastIndexOf**(`searchElement`, `fromIndices?`, `maxDepth?`): `number`[] \| `undefined`

Returns the coordinates of the last occurrence of a specified value in an array, or `undefined` if it is not present.

```js
[[0, 1, 2], [3, 4, 5]].nestedLastIndexOf(2); // [0, 2]
[[0, 1, 2], [3, 4, 5]].nestedLastIndexOf(2, [1, 1]); // undefined
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `searchElement` | `T` | The element to search for. |
| `fromIndices?` | `number`[] | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |

#### Returns

`number`[] \| `undefined`

A number array containing the coordinates of the element, or `undefined` if it is not present.

___

### nestedFind, nestedFindLast

▸ `array`<`T`\>.**nestedFind**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `T` \| `undefined`

Returns the value of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.

```js
[[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3); // 3
[[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3, [0, 1]); // undefined
```

▸ `array`<`T`\>.**nestedFindLast**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `T` \| `undefined`

Returns the value of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.

```js
[[0, 1, 2], [3, 4, 5]].nestedFindLast(n => n % 6 == 2); // 2
[[0, 1, 2], [3, 4, 5]].nestedFindLast(n => n % 6 == 2, [1, 1]); // undefined
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `predicate` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `unknown` | A function that accepts up to 4 arguments. The `nestedFind` method calls the `predicate` function one time for each element in the array until it returns a truthy value. |
| `fromIndices?` | `number`[] | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`T` \| `undefined`

The value of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.

___

### nestedFindIndex, nestedFindLastIndex

▸ `array`<`T`\>.**nestedFindIndex**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `number`[] \| `undefined`

Returns the coordinates of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.

```js
[[0, 1, 2], [3, 4, 5]].nestedFindIndex(n => n % 6 == 3); // [1, 0]
[[0, 1, 2], [3, 4, 5]].nestedFindIndex(n => n % 6 == 3, [0, 1]); // undefined
```

▸ `array`<`T`\>.**nestedFindLastIndex**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `number`[] \| `undefined`

Returns the coordinates of the last element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.

```js
[[0, 1, 2], [3, 4, 5]].nestedFindLastIndex(n => n % 6 == 2); // [0, 2]
[[0, 1, 2], [3, 4, 5]].nestedFindLastIndex(n => n % 6 == 2, [1, 1]); // undefined
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `predicate` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `unknown` | A function that accepts up to 4 arguments. The `nestedFindIndex` method calls the `predicate` function one time for each element in the array until it returns a truthy value. |
| `fromIndices?` | `number`[] | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`number`[] \| `undefined`

The coordinates of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.

___

### nestedSome, nestedSomeFromLast

▸ `array`<`T`\>.**nestedSome**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `boolean`

Determines whether at least one element in a nested array satisfies the `predicate` function, searching forwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedSome(n => n % 6 == 3); // true
[[0, 1, 2], [3, 4, 5]].nestedSome(n => n % 6 == 3, [0, 1]); // false
```

▸ `array`<`T`\>.**nestedSomeFromLast**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `boolean`

Determines whether at least one element in a nested array satisfies the `predicate` function, searching backwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedSomeFromLast(n => n % 6 == 2); // true
[[0, 1, 2], [3, 4, 5]].nestedSomeFromLast(n => n % 6 == 2, [1, 1]); // false
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `predicate` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `unknown` | A function that accepts up to 4 arguments. The `nestedSome` method calls the `predicate` function one time for each element in the array until it returns a truthy value. |
| `fromIndices?` | `number`[] | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`boolean`

`true` if at least one element in the array satisfies the `predicate` function, or `false` otherwise.

___

### nestedEvery, nestedEveryFromLast

▸ `array`<`T`\>.**nestedEvery**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `boolean`

Determines whether all elements in a nested array satisfies the `predicate` function, searching forwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3); // false
[[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3, [0, 1]); // true
```

▸ `array`<`T`\>.**nestedEveryFromLast**(`predicate`, `fromIndices?`, `maxDepth?`, `thisArg?`): `boolean`

Determines whether all elements in a nested array satisfies the `predicate` function, searching backwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedEveryFromLast(n => n % 6 != 2); // false
[[0, 1, 2], [3, 4, 5]].nestedEveryFromLast(n => n % 6 != 2, [1, 1]); // true
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `predicate` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `unknown` | A function that accepts up to 4 arguments. The `nestedEvery` method calls the `predicate` function one time for each element in the array until it returns a falsy value. |
| `fromIndices?` | `number`[] | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |
| `maxDepth?` | `number` | The deepest axis the method will traverse. Defaults to `Infinity`. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`boolean`

`true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.

<!-- prettier-ignore-end -->
