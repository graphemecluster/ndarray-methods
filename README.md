# ndarray-methods

[![npm](https://img.shields.io/npm/v/ndarray-methods)](https://www.npmjs.com/package/ndarray-methods) [![types](https://img.shields.io/npm/types/ndarray-methods)](https://www.npmjs.com/package/ndarray-methods) [![license](https://img.shields.io/npm/l/ndarray-methods)](https://www.npmjs.com/package/ndarray-methods)

Convenient methods for JavaScript built-in multi-dimensional arrays.

Zero dependencies. Written in TypeScript.

## Getting Started

### Install

```
npm install ndarray-methods
```

### Usage

```js
import NDArray from "ndarray-methods";

NDArray.buildShape([8], 0);
// [0, 0, 0, 0, 0, 0, 0, 0]

NDArray.buildShape([4, 3], (x, y) => x + y);
// [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]]

NDArray.shape($_);
// [4, 3]

NDArray.nestedSplit(
  [/\r?\n|\r/, ","],
  `#,Item,Price
A1024,foo,120
A1025,bar,240
A1026,baz,480`
);
/*
[
  ["#", "Item", "Price"],
  ["A1024", "foo", "120"],
  ["A1025", "bar", "240"],
  ["A1026", "baz", "480"]
]
*/

NDArray.nestedJoin(["\n", ","], $_);
/*
`#,Item,Price
A1024,foo,120
A1025,bar,240
A1026,baz,480`
*/
```

## Trivial

This library is originally intended to extend the built-in `Array.prototype`, so many methods are prefixed with the word `nested`.

Also, the first argument of each function must be an array, so that you can "polyfill" the methods with the following snippet:

(_Currently not recommended_)

```js
import NDArray from "ndarray-methods";

Object.entries(NDArray).forEach(([name, method]) => {
  if (!Array.prototype[name])
    Object.defineProperty(Array.prototype, name, {
      value(...args) {
        return method(this, ...args);
      },
    });
});
```

In the documentation, all the examples are written in the "polyfilled" style.

A new ECMAScript Proposal with these methods will be made soon.

The documentation is written based on the declaration files, so as to make the wording consistent with the specification.

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

▸ **buildShape**<`T`\>(`array`, `mapfn`, `thisArg?`): `NDArray`<`T`\>

Builds a nested array with a specific shape and fills the array with the result of a defined map function.

```js
[2, 3].buildShape((x, y) => x * 3 + y); // [[0, 1, 2], [3, 4, 5]]
```

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

▸ **buildShape**<`T`\>(`array`, `value`): `NDArray`<`T`\>

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

▸ **shape**(`array`): `number`[]

Gets the length of each axis of a nested array. The `shape` method returns the shape at the deepest element.

```js
[[0, 1, 2], [3, 4, 5]].shape(); // [2, 3]
[[0, 1], [2, [3, 4], 5]].shape(); // [2, 3, 2]
```

▸ **shapeAtOrigin**(`array`): `number`[]

Gets the length of each axis of a nested array. The `shapeAtOrigin` method only checks the first element recursively.

```js
[[0, 1, 2], [3, 4, 5]].shapeAtOrigin(); // [2, 3]
[[0, 1], [2, [3, 4], 5]].shapeAtOrigin(); // [2, 2]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`unknown`\> | The original array. |

#### Returns

`number`[]

A number array containing the lengths of each axis of the array.

___

### nestedMap

▸ **nestedMap**<`T`, `U`\>(`array`, `callbackfn`, `thisArg?`): `NDArray`<`U`\>

Calls a defined callback function on each element in a nested array, and returns a deeply-cloned array that contains the results.

```js
[[0, 1, 2], [3, 4, 5]].nestedMap(n => n + 10); // [[10, 11, 12], [13, 14, 15]]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `callbackfn` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `U` | A function that accepts up to 4 arguments. The `nestedMap` method calls the `callbackfn` function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `callbackfn` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`NDArray`<`U`\>

The mapped array.

___

### nestedForEach

▸ **nestedForEach**<`T`, `U`\>(`array`, `callbackfn`, `thisArg?`): `void`

Performs the specified action for each element in a nested array.

```js
[[0, 1, 2], [3, 4, 5]].nestedForEach(n => console.log(n)); // Prints 0 to 5
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | The original array. |
| `callbackfn` | (`value`: `T`, `index`: `number`[], `array`: `NDArray`<`T`\>, `parent`: `NDArray`<`T`\>) => `U` | A function that accepts up to 4 arguments. The `nestedForEach` method calls the `callbackfn` function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `callbackfn` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

### nestedSplit

▸ **nestedSplit**(`separators`, `content`): `NDArray`<`string`\>

Splits a string into substrings using the specified separators for each axis and return them as a nested array.

```js
[/,|;/, ""].nestedSplit("AB,CD;EF"); // [["A", "B"], ["C", "D"], ["E", "F"]]
```

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

▸ **nestedJoin**(`separators`, `content`): `string`

Concatenates all the elements in a nested array into a string, separated by the specified separator strings for each axis.

```js
[",", ""].nestedJoin([[0, 1, 2], [3, 4, 5]]); // "012,345"
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `separators` | `string`[] | A string used to separate one element of the array from the next in the resulting string. If a certain separator is `undefined`, a comma (`,`) is used instead for that axis. |
| `content` | `NDArray`<`string`\> | The array to join. |

#### Returns

`string`

A string with all the elements concatenated.

___

### nestedFill

▸ **nestedFill**<`T`\>(`array`, `value`, `startIndices?`, `endIndices?`): `NDArray`<`T`\>

Changes all elements in a nested array from `startIndices` to `endIndices` to a static value in place and returns the array.

```js
[[0, 1, 2], [3, 4, 5]].nestedFill(10); // [[10, 10, 10], [10, 10, 10]]
[[0, 1, 2], [3, 4, 5]].nestedFill(10, [0, 0], [2, 2]); // [[10, 10, 2], [10, 10, 5]]
```

If both `startIndices` and `endIndices` are omitted, all the elements will be replaced to the specified value.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | `undefined` | The original array. |
| `value` | `T` | `undefined` | The value to fill the section of the array with. |
| `startIndices` | `number`[] | `[]` | The coordinates to start filling the array at (inclusive). If a certain start index is negative, the length of that axis of the array will be added to it. |
| `endIndices` | `number`[] | `[]` | The coordinates to stop filling the array at (exclusive). If a certain end index is negative, the length of that axis of the array will be added to it. |

#### Returns

`NDArray`<`T`\>

The modified array, which the instance is the same as the original array.

___

### nestedFillMap

▸ **nestedFillMap**<`T`\>(`array`, `callbackfn`, `startIndices?`, `endIndices?`, `thisArg?`): `NDArray`<`T`\>

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
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `callbackfn` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`NDArray`<`T`\>

The modified array, which the instance is the same as the original array.

___

### nestedIncludes, nestedIncludesFromLast

▸ **nestedIncludes**<`T`\>(`array`, `searchElement`, `fromIndices?`): `boolean`

Determines whether a nested array includes a specified element, searching forwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedIncludes(3); // true
[[0, 1, 2], [3, 4, 5]].nestedIncludes(3, [0, 1]); // false
```

▸ **nestedIncludesFromLast**<`T`\>(`array`, `searchElement`, `fromIndices?`): `boolean`

Determines whether a nested array includes a specified element, searching backwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedIncludesFromLast(2); // true
[[0, 1, 2], [3, 4, 5]].nestedIncludesFromLast(2, [1, 1]); // false
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | `undefined` | The original array. |
| `searchElement` | `T` | `undefined` | The element to search for. |
| `fromIndices` | `number`[] | `[]` | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |

#### Returns

`boolean`

`true` if the element is found in the array, or `false` otherwise.

___

### nestedIndexOf, nestedLastIndexOf

▸ **nestedIndexOf**<`T`\>(`array`, `searchElement`, `fromIndices?`): `number`[] \| `undefined`

Returns the coordinates of the first occurrence of a specified value in an array, or `undefined` if it is not present.

```js
[[0, 1, 2], [3, 4, 5]].nestedIndexOf(3); // [1, 0]
[[0, 1, 2], [3, 4, 5]].nestedIndexOf(3, [0, 1]); // undefined
```

▸ **nestedLastIndexOf**<`T`\>(`array`, `searchElement`, `fromIndices?`): `number`[] \| `undefined`

Returns the coordinates of the last occurrence of a specified value in an array, or `undefined` if it is not present.

```js
[[0, 1, 2], [3, 4, 5]].nestedLastIndexOf(2); // [0, 2]
[[0, 1, 2], [3, 4, 5]].nestedLastIndexOf(2, [1, 1]); // undefined
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `array` | `NDArray`<`T`\> | `undefined` | The original array. |
| `searchElement` | `T` | `undefined` | The element to search for. |
| `fromIndices` | `number`[] | `[]` | The coordinates at which to begin searching for (inclusive). If a certain index is negative, the length of that axis of the array will be added to it. |

#### Returns

`number`[] \| `undefined`

A number array containing the coordinates of the element, or `undefined` if it is not present.

___

### nestedFind, nestedFindLast

▸ **nestedFind**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `T` \| `undefined`

Returns the value of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.

```js
[[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3); // 3
[[0, 1, 2], [3, 4, 5]].nestedFind(n => n % 6 == 3, [0, 1]); // undefined
```

▸ **nestedFindLast**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `T` \| `undefined`

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
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`T` \| `undefined`

The value of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.

___

### nestedFindIndex, nestedFindLastIndex

▸ **nestedFindIndex**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `number`[] \| `undefined`

Returns the coordinates of the first element in a nested array that satisfies the `predicate` function, or `undefined` if there is no such element.

```js
[[0, 1, 2], [3, 4, 5]].nestedFindIndex(n => n % 6 == 3); // [1, 0]
[[0, 1, 2], [3, 4, 5]].nestedFindIndex(n => n % 6 == 3, [0, 1]); // undefined
```

▸ **nestedFindLastIndex**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `number`[] \| `undefined`

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
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`number`[] \| `undefined`

The coordinates of the first element in the array that satisfies the `predicate` function, or `undefined` if there is no such element.

___

### nestedSome, nestedSomeFromLast

▸ **nestedSome**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `boolean`

Determines whether at least one element in a nested array satisfies the `predicate` function, searching forwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedSome(n => n % 6 == 3); // true
[[0, 1, 2], [3, 4, 5]].nestedSome(n => n % 6 == 3, [0, 1]); // false
```

▸ **nestedSomeFromLast**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `boolean`

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
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`boolean`

`true` if at least one element in the array satisfies the `predicate` function, or `false` otherwise.

___

### nestedEvery, nestedEveryFromLast

▸ **nestedEvery**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `boolean`

Determines whether all elements in a nested array satisfies the `predicate` function, searching forwards.

```js
[[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3); // false
[[0, 1, 2], [3, 4, 5]].nestedEvery(n => n % 6 != 3, [0, 1]); // true
```

▸ **nestedEveryFromLast**<`T`\>(`array`, `predicate`, `fromIndices?`, `thisArg?`): `boolean`

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
| `thisArg?` | `any` | An object to which the `this` keyword can refer in the `predicate` function. If `thisArg` is omitted, `undefined` is used as the `this` value. |

#### Returns

`boolean`

`true` if all elements in the array satisfies the `predicate` function, or `false` otherwise.

<!-- prettier-ignore-end -->
