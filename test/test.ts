import "../dist/polyfill";

test("buildShape, nestedMap and nestedForEach", () => {
  const zeros = Array.fromShape([3, 4, 5], 0);
  expect(zeros).toEqual([
    [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  ]);
  const expected = [
    [
      ["000", "001", "002", "003", "004"],
      ["010", "011", "012", "013", "014"],
      ["020", "021", "022", "023", "024"],
      ["030", "031", "032", "033", "034"],
    ],
    [
      ["100", "101", "102", "103", "104"],
      ["110", "111", "112", "113", "114"],
      ["120", "121", "122", "123", "124"],
      ["130", "131", "132", "133", "134"],
    ],
    [
      ["200", "201", "202", "203", "204"],
      ["210", "211", "212", "213", "214"],
      ["220", "221", "222", "223", "224"],
      ["230", "231", "232", "233", "234"],
    ],
  ];
  expect(Array.fromShape([3, 4, 5], (...coords) => coords.join(""))).toEqual(expected);
  expect(Array.fromShape([1, 1, 1, 1, 1, 1, 1, 0], "never")).toEqual([[[[[[[[]]]]]]]]);

  expect(zeros.nestedMap((_, coords) => coords.join(""))).toEqual(expected);
  const values = Array.fromShape([3, 4, 5], [""][0]);
  zeros.nestedForEach((_, [x, y, z]) => (values[x][y][z] = "" + x + y + z));
  expect(values).toEqual(expected);
});

test("shape and shapeAtOrigin", () => {
  const array = [
    [[[], "foo", "bar"], [], "baz", []],
    ["foo", []],
    [[], [["foo", "bar", []], "baz"]],
  ];
  expect(array.shape()).toEqual([3, 2, 2, 3, 0]);
  expect(array.shapeAtOrigin()).toEqual([3, 4, 3, 0]);
  expect([[[[[[[[]]]]]]]].shape()).toEqual([1, 1, 1, 1, 1, 1, 1, 0]);
  expect([[[[[[[[]]]]]]]].shapeAtOrigin()).toEqual([1, 1, 1, 1, 1, 1, 1, 0]);
});

test("nestedSplit and nestedJoin", () => {
  const string = [
    "573 962 841",
    "142 738 956",
    "869 541 327",
    "",
    "925 173 684",
    "738 694 215",
    "416 285 793",
    "",
    "381 426 579",
    "694 857 132",
    "257 319 468",
  ].join("\n");
  const board = Array.nestedSplit([/(?:\r?\n|\r){2}/, /\r?\n|\r/, " ", ""], string);
  // prettier-ignore
  expect(board).toEqual([
    [
      [["5", "7", "3"], ["9", "6", "2"], ["8", "4", "1"]],
      [["1", "4", "2"], ["7", "3", "8"], ["9", "5", "6"]],
      [["8", "6", "9"], ["5", "4", "1"], ["3", "2", "7"]],
    ],
    [
      [["9", "2", "5"], ["1", "7", "3"], ["6", "8", "4"]],
      [["7", "3", "8"], ["6", "9", "4"], ["2", "1", "5"]],
      [["4", "1", "6"], ["2", "8", "5"], ["7", "9", "3"]],
    ],
    [
      [["3", "8", "1"], ["4", "2", "6"], ["5", "7", "9"]],
      [["6", "9", "4"], ["8", "5", "7"], ["1", "3", "2"]],
      [["2", "5", "7"], ["3", "1", "9"], ["4", "6", "8"]],
    ],
  ]);
  expect(Array.nestedJoin(["\n\n", "\n", " ", ""], board)).toBe(string);
});

test("nestedFill and nestedFillMap", () => {
  const array = Array.fromShape([3, 4, 5], (...coords) => coords.join(""));
  array.nestedFill("___", [0, 1, 2], [1, 3, 5]);
  expect(array).toEqual([
    [
      ["000", "001", "002", "003", "004"],
      ["010", "011", "___", "___", "___"],
      ["020", "021", "___", "___", "___"],
      ["030", "031", "032", "033", "034"],
    ],
    [
      ["100", "101", "102", "103", "104"],
      ["110", "111", "112", "113", "114"],
      ["120", "121", "122", "123", "124"],
      ["130", "131", "132", "133", "134"],
    ],
    [
      ["200", "201", "202", "203", "204"],
      ["210", "211", "212", "213", "214"],
      ["220", "221", "222", "223", "224"],
      ["230", "231", "232", "233", "234"],
    ],
  ]);
  array.nestedFillMap((_, coords) => coords.map(coord => String.fromCharCode(65 + coord)).join(""), [1, 2, 1]);
  expect(array).toEqual([
    [
      ["000", "001", "002", "003", "004"],
      ["010", "011", "___", "___", "___"],
      ["020", "021", "___", "___", "___"],
      ["030", "031", "032", "033", "034"],
    ],
    [
      ["100", "101", "102", "103", "104"],
      ["110", "111", "112", "113", "114"],
      ["120", "BCB", "BCC", "BCD", "BCE"],
      ["130", "BDB", "BDC", "BDD", "BDE"],
    ],
    [
      ["200", "201", "202", "203", "204"],
      ["210", "211", "212", "213", "214"],
      ["220", "CCB", "CCC", "CCD", "CCE"],
      ["230", "CDB", "CDC", "CDD", "CDE"],
    ],
  ]);
});

test("nestedIncludes, nestedIncludesFromLast, nestedIndexOf and nestedLastIndexOf", () => {
  const array = Array.fromShape([3, 4, 5], (...coords) => coords.join(""));

  expect(array.nestedIncludes("123")).toBe(true);
  expect(array.nestedIncludes("456")).toBe(false);
  expect(array.nestedIncludesFromLast("123")).toBe(true);
  expect(array.nestedIncludesFromLast("456")).toBe(false);
  expect(array.nestedIncludes("123", [0, 3, 2])).toBe(false);
  expect(array.nestedIncludesFromLast("123", [0, 3, 2])).toBe(false);
  expect(array.nestedIncludes("123", [2, 2, 3])).toBe(false);
  expect(array.nestedIncludesFromLast("123", [2, 2, 3])).toBe(true);

  expect(array.nestedIndexOf("123")).toEqual([1, 2, 3]);
  expect(array.nestedIndexOf("456")).toBeUndefined();
  expect(array.nestedLastIndexOf("123")).toEqual([1, 2, 3]);
  expect(array.nestedLastIndexOf("456")).toBeUndefined();
  expect(array.nestedIndexOf("123", [0, 3, 2])).toBeUndefined();
  expect(array.nestedLastIndexOf("123", [0, 3, 2])).toBeUndefined();
  expect(array.nestedIndexOf("123", [2, 2, 3])).toBeUndefined();
  expect(array.nestedLastIndexOf("123", [2, 2, 3])).toEqual([1, 2, 3]);
});

test("nestedFind, nestedFindLast, nestedFindIndex and nestedFindLastIndex", () => {
  const array = Array.fromShape([3, 4, 5], (...coords) => coords.join(""));
  const sum = (coords: number[]) => coords.reduce((a, b) => a + b);

  expect(array.nestedFind((_, coords) => sum(coords) >= 5)).toBe("014");
  expect(array.nestedFind((_, coords) => sum(coords) >= 10)).toBeUndefined();
  expect(array.nestedFindLast((_, coords) => sum(coords) <= 3)).toBe("210");
  expect(array.nestedFindLast((_, coords) => sum(coords) < 0)).toBeUndefined();
  expect(array.nestedFind((_, coords) => sum(coords) >= 5, [1, 2, 0])).toBe("122");
  expect(array.nestedFindLast((_, coords) => sum(coords) <= 3, [1, 3, 3])).toBe("120");
  expect(array.nestedFind((_, coords) => sum(coords) <= 3, [2, 1, 1])).toBeUndefined();
  expect(array.nestedFindLast((_, coords) => sum(coords) >= 5, [0, 1, 3])).toBeUndefined();

  expect(array.nestedFindIndex((_, coords) => sum(coords) >= 5)).toEqual([0, 1, 4]);
  expect(array.nestedFindIndex((_, coords) => sum(coords) >= 10)).toBeUndefined();
  expect(array.nestedFindLastIndex((_, coords) => sum(coords) <= 3)).toEqual([2, 1, 0]);
  expect(array.nestedFindLastIndex((_, coords) => sum(coords) < 0)).toBeUndefined();
  expect(array.nestedFindIndex((_, coords) => sum(coords) >= 5, [1, 2, 0])).toEqual([1, 2, 2]);
  expect(array.nestedFindLastIndex((_, coords) => sum(coords) <= 3, [1, 3, 3])).toEqual([1, 2, 0]);
  expect(array.nestedFindIndex((_, coords) => sum(coords) <= 3, [2, 1, 1])).toBeUndefined();
  expect(array.nestedFindLastIndex((_, coords) => sum(coords) >= 5, [0, 1, 3])).toBeUndefined();
});

test("nestedSome, nestedSomeFromLast, nestedEvery and nestedEveryFromLast", () => {
  const array = Array.fromShape([3, 4, 5], (...coords) => coords.join(""));
  const sum = (coords: number[]) => coords.reduce((a, b) => a + b);

  expect(array.nestedSome((_, coords) => sum(coords) >= 5)).toBe(true);
  expect(array.nestedSome((_, coords) => sum(coords) >= 10)).toBe(false);
  expect(array.nestedSomeFromLast((_, coords) => sum(coords) <= 3)).toBe(true);
  expect(array.nestedSomeFromLast((_, coords) => sum(coords) < 0)).toBe(false);
  expect(array.nestedSome((_, coords) => sum(coords) >= 5, [1, 2, 0])).toBe(true);
  expect(array.nestedSomeFromLast((_, coords) => sum(coords) <= 3, [1, 3, 3])).toBe(true);
  expect(array.nestedSome((_, coords) => sum(coords) <= 3, [2, 1, 1])).toBe(false);
  expect(array.nestedSomeFromLast((_, coords) => sum(coords) >= 5, [0, 1, 3])).toBe(false);

  expect(array.nestedEvery((_, coords) => sum(coords) < 5)).toBe(false);
  expect(array.nestedEvery((_, coords) => sum(coords) < 10)).toBe(true);
  expect(array.nestedEveryFromLast((_, coords) => sum(coords) > 3)).toBe(false);
  expect(array.nestedEveryFromLast((_, coords) => sum(coords) >= 0)).toBe(true);
  expect(array.nestedEvery((_, coords) => sum(coords) < 5, [1, 2, 0])).toBe(false);
  expect(array.nestedEveryFromLast((_, coords) => sum(coords) > 3, [1, 3, 3])).toBe(false);
  expect(array.nestedEvery((_, coords) => sum(coords) > 3, [2, 1, 1])).toBe(true);
  expect(array.nestedEveryFromLast((_, coords) => sum(coords) < 5, [0, 1, 3])).toBe(true);
});

// prettier-ignore
test("Examples in the documentation", () => {
  const array = [[0, 1, 2], [3, 4, 5]];

  expect(Array.fromShape([2, 3], (x, y) => x * 3 + y)).toEqual(array);
  expect(Array.fromShape([2, 3], 10)).toEqual([[10, 10, 10], [10, 10, 10]]);

  expect(array.shape()).toEqual([2, 3]);
  expect([[0, 1], [2, [3, 4], 5]].shape()).toEqual([2, 3, 2]);
  expect(array.shapeAtOrigin()).toEqual([2, 3]);
  expect([[0, 1], [2, [3, 4], 5]].shapeAtOrigin()).toEqual([2, 2]);

  expect(array.nestedMap(n => n + 10)).toEqual([[10, 11, 12], [13, 14, 15]]);
  expect(Array.nestedSplit([/,|;/, ""], "AB,CD;EF")).toEqual([["A", "B"], ["C", "D"], ["E", "F"]]);
  expect(Array.nestedJoin([",", ""], array)).toBe("012,345");

  expect([[0, 1, 2], [3, 4, 5]].nestedFill(10)).toEqual([[10, 10, 10], [10, 10, 10]]);
  expect([[0, 1, 2], [3, 4, 5]].nestedFill(10, [0, 0], [2, 2])).toEqual([[10, 10, 2], [10, 10, 5]]);
  expect([[0, 1, 2], [3, 4, 5]].nestedFillMap(n => n + 10)).toEqual([[10, 11, 12], [13, 14, 15]]);
  expect([[0, 1, 2], [3, 4, 5]].nestedFillMap(n => n + 10, [0, 0], [2, 2])).toEqual([[10, 11, 2], [13, 14, 5]]);

  expect(array.nestedIncludes(3)).toBe(true);
  expect(array.nestedIncludes(3, [0, 1])).toBe(false);
  expect(array.nestedIncludesFromLast(2)).toBe(true);
  expect(array.nestedIncludesFromLast(2, [1, 1])).toBe(false);

  expect(array.nestedIndexOf(3)).toEqual([1, 0]);
  expect(array.nestedIndexOf(3, [0, 1])).toBeUndefined();
  expect(array.nestedLastIndexOf(2)).toEqual([0, 2]);
  expect(array.nestedLastIndexOf(2, [1, 1])).toBeUndefined();

  expect(array.nestedFind(n => n % 6 == 3)).toBe(3);
  expect(array.nestedFind(n => n % 6 == 3, [0, 1])).toBeUndefined();
  expect(array.nestedFindLast(n => n % 6 == 2)).toBe(2);
  expect(array.nestedFindLast(n => n % 6 == 2, [1, 1])).toBeUndefined();

  expect(array.nestedFindIndex(n => n % 6 == 3)).toEqual([1, 0]);
  expect(array.nestedFindIndex(n => n % 6 == 3, [0, 1])).toBeUndefined();
  expect(array.nestedFindLastIndex(n => n % 6 == 2)).toEqual([0, 2]);
  expect(array.nestedFindLastIndex(n => n % 6 == 2, [1, 1])).toBeUndefined();

  expect(array.nestedSome(n => n % 6 == 3)).toBe(true);
  expect(array.nestedSome(n => n % 6 == 3, [0, 1])).toBe(false);
  expect(array.nestedSomeFromLast(n => n % 6 == 2)).toBe(true);
  expect(array.nestedSomeFromLast(n => n % 6 == 2, [1, 1])).toBe(false);

  expect(array.nestedEvery(n => n % 6 != 3)).toBe(false);
  expect(array.nestedEvery(n => n % 6 != 3, [0, 1])).toBe(true);
  expect(array.nestedEveryFromLast(n => n % 6 != 2)).toBe(false);
  expect(array.nestedEveryFromLast(n => n % 6 != 2, [1, 1])).toBe(true);
});

test("maxDepth parameter", () => {
  const array = Array.fromShape([3, 4, 5, 6], (...coords) => coords.join(""));

  expect(array.shape(2)).toEqual([3, 4]);
  expect(array.shape(8)).toEqual([3, 4, 5, 6]);
  expect(array.shapeAtOrigin(2)).toEqual([3, 4]);
  expect(array.shapeAtOrigin(8)).toEqual([3, 4, 5, 6]);

  expect(
    array.nestedMap((n, indices) => {
      expect(n.shapeAtOrigin()).toEqual([5, 6]);
      return indices;
    }, 2)
  ).toEqual(Array.fromShape([3, 4], (...coords) => coords));
  let i = 0;
  array.nestedForEach(n => {
    expect(n.shapeAtOrigin()).toEqual([5, 6]);
    i++;
  }, 2);
  expect(i).toBe(12);

  expect(Array.nestedJoin(["\n\n", "\n", " ", ""], array, 3)).toContain(",");
  expect(Array.nestedJoin(["\n\n", "\n", " ", ""], array, 2)).not.toContain(" ");

  expect(array.nestedMap(n => n, 2).nestedFill([[]], undefined, undefined, 2)).toEqual(Array.fromShape([3, 4], [[]]));
  expect(
    array
      .nestedMap(n => n, 2)
      .nestedFillMap(
        (n, indices) => {
          expect(n.shapeAtOrigin()).toEqual([5, 6]);
          return [[indices.join("")]];
        },
        undefined,
        undefined,
        2
      )
  ).toEqual(Array.fromShape([3, 4], (...coords) => [[coords.join("")]]));

  expect(array.nestedIncludes(array[1][2], undefined, 2)).toBe(true);
  expect(array.nestedIncludesFromLast(array[2][1], undefined, 2)).toBe(true);

  expect(array.nestedIndexOf(array[1][2], undefined, 2)).toEqual([1, 2]);
  expect(array.nestedLastIndexOf(array[2][1], undefined, 2)).toEqual([2, 1]);

  expect(array.nestedFind(n => n == array[1][2], undefined, 2)).toBe(array[1][2]);
  expect(array.nestedFindLast(n => n == array[2][1], undefined, 2)).toBe(array[2][1]);

  expect(array.nestedFindIndex(n => n == array[1][2], undefined, 2)).toEqual([1, 2]);
  expect(array.nestedFindLastIndex(n => n == array[2][1], undefined, 2)).toEqual([2, 1]);

  const test = (c: boolean) => (n: string[][]) => {
    const [a, b] = n.shapeAtOrigin();
    return (a == 5 && b == 6) == c;
  };

  expect(array.nestedSome(n => n == array[1][2], undefined, 2)).toBe(true);
  expect(array.nestedSomeFromLast(n => n == array[2][1], undefined, 2)).toBe(true);
  expect(array.nestedSome(test(false), undefined, 2)).toBe(false);
  expect(array.nestedSomeFromLast(test(false), undefined, 2)).toBe(false);

  expect(array.nestedEvery(n => n != array[1][2], undefined, 2)).toBe(false);
  expect(array.nestedEveryFromLast(n => n != array[2][1], undefined, 2)).toBe(false);
  expect(array.nestedEvery(test(true), undefined, 2)).toBe(true);
  expect(array.nestedEveryFromLast(test(true), undefined, 2)).toBe(true);
});
