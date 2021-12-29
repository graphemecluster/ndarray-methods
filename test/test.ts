import NDArray from "../src";

test("buildShape, nestedMap and nestedForEach", () => {
  const zeros = NDArray.buildShape([3, 4, 5], 0);
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
  expect(NDArray.buildShape([3, 4, 5], (...coords) => coords.join(""))).toEqual(expected);
  expect(NDArray.buildShape([1, 1, 1, 1, 1, 1, 1, 0], "never")).toEqual([[[[[[[[]]]]]]]]);

  expect(NDArray.nestedMap(zeros, (_, coords) => coords.join(""))).toEqual(expected);
  const values: string[][][] = [
    [[], [], [], []],
    [[], [], [], []],
    [[], [], [], []],
  ];
  NDArray.nestedForEach(zeros, (_, coords) => (values[coords[0]][coords[1]][coords[2]] = coords.join("")));
  expect(values).toEqual(expected);
});

test("shape and shapeAtOrigin", () => {
  const array = [
    [[[], "foo", "bar"], [], "baz", []],
    ["foo", []],
    [[], [["foo", "bar", []], "baz"]],
  ];
  expect(NDArray.shape(array)).toEqual([3, 2, 2, 3, 0]);
  expect(NDArray.shapeAtOrigin(array)).toEqual([3, 4, 3, 0]);
  expect(NDArray.shape([[[[[[[[]]]]]]]])).toEqual([1, 1, 1, 1, 1, 1, 1, 0]);
  expect(NDArray.shapeAtOrigin([[[[[[[[]]]]]]]])).toEqual([1, 1, 1, 1, 1, 1, 1, 0]);
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
  const board = NDArray.nestedSplit([/(?:\r?\n|\r){2}/, /\r?\n|\r/, " ", ""], string);
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
  expect(NDArray.nestedJoin(["\n\n", "\n", " ", ""], board)).toBe(string);
});

test("nestedFill and nestedFillMap", () => {
  const array = NDArray.buildShape([3, 4, 5], (...coords) => coords.join(""));
  NDArray.nestedFill(array, "___", [0, 1, 2], [1, 3, 5]);
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
  NDArray.nestedFillMap(array, (_, coords) => coords.map(coord => String.fromCharCode(65 + coord)).join(""), [1, 2, 1]);
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
  const array = NDArray.buildShape([3, 4, 5], (...coords) => coords.join(""));

  expect(NDArray.nestedIncludes(array, "123")).toBe(true);
  expect(NDArray.nestedIncludes(array, "456")).toBe(false);
  expect(NDArray.nestedIncludesFromLast(array, "123")).toBe(true);
  expect(NDArray.nestedIncludesFromLast(array, "456")).toBe(false);
  expect(NDArray.nestedIncludes(array, "123", [0, 3, 2])).toBe(false);
  expect(NDArray.nestedIncludesFromLast(array, "123", [0, 3, 2])).toBe(false);
  expect(NDArray.nestedIncludes(array, "123", [2, 2, 3])).toBe(false);
  expect(NDArray.nestedIncludesFromLast(array, "123", [2, 2, 3])).toBe(true);

  expect(NDArray.nestedIndexOf(array, "123")).toEqual([1, 2, 3]);
  expect(NDArray.nestedIndexOf(array, "456")).toBeUndefined();
  expect(NDArray.nestedLastIndexOf(array, "123")).toEqual([1, 2, 3]);
  expect(NDArray.nestedLastIndexOf(array, "456")).toBeUndefined();
  expect(NDArray.nestedIndexOf(array, "123", [0, 3, 2])).toBeUndefined();
  expect(NDArray.nestedLastIndexOf(array, "123", [0, 3, 2])).toBeUndefined();
  expect(NDArray.nestedIndexOf(array, "123", [2, 2, 3])).toBeUndefined();
  expect(NDArray.nestedLastIndexOf(array, "123", [2, 2, 3])).toEqual([1, 2, 3]);
});

test("nestedFind, nestedFindLast, nestedFindIndex and nestedFindLastIndex", () => {
  const array = NDArray.buildShape([3, 4, 5], (...coords) => coords.join(""));
  const sum = (coords: number[]) => coords.reduce((a, b) => a + b);

  expect(NDArray.nestedFind(array, (_, coords) => sum(coords) >= 5)).toBe("014");
  expect(NDArray.nestedFind(array, (_, coords) => sum(coords) >= 10)).toBeUndefined();
  expect(NDArray.nestedFindLast(array, (_, coords) => sum(coords) <= 3)).toBe("210");
  expect(NDArray.nestedFindLast(array, (_, coords) => sum(coords) < 0)).toBeUndefined();
  expect(NDArray.nestedFind(array, (_, coords) => sum(coords) >= 5, [1, 2, 0])).toBe("122");
  expect(NDArray.nestedFindLast(array, (_, coords) => sum(coords) <= 3, [1, 3, 3])).toBe("120");
  expect(NDArray.nestedFind(array, (_, coords) => sum(coords) <= 3, [2, 1, 1])).toBeUndefined();
  expect(NDArray.nestedFindLast(array, (_, coords) => sum(coords) >= 5, [0, 1, 3])).toBeUndefined();

  expect(NDArray.nestedFindIndex(array, (_, coords) => sum(coords) >= 5)).toEqual([0, 1, 4]);
  expect(NDArray.nestedFindIndex(array, (_, coords) => sum(coords) >= 10)).toBeUndefined();
  expect(NDArray.nestedFindLastIndex(array, (_, coords) => sum(coords) <= 3)).toEqual([2, 1, 0]);
  expect(NDArray.nestedFindLastIndex(array, (_, coords) => sum(coords) < 0)).toBeUndefined();
  expect(NDArray.nestedFindIndex(array, (_, coords) => sum(coords) >= 5, [1, 2, 0])).toEqual([1, 2, 2]);
  expect(NDArray.nestedFindLastIndex(array, (_, coords) => sum(coords) <= 3, [1, 3, 3])).toEqual([1, 2, 0]);
  expect(NDArray.nestedFindIndex(array, (_, coords) => sum(coords) <= 3, [2, 1, 1])).toBeUndefined();
  expect(NDArray.nestedFindLastIndex(array, (_, coords) => sum(coords) >= 5, [0, 1, 3])).toBeUndefined();
});

test("nestedSome, nestedSomeFromLast, nestedEvery and nestedEveryFromLast", () => {
  const array = NDArray.buildShape([3, 4, 5], (...coords) => coords.join(""));
  const sum = (coords: number[]) => coords.reduce((a, b) => a + b);

  expect(NDArray.nestedSome(array, (_, coords) => sum(coords) >= 5)).toBe(true);
  expect(NDArray.nestedSome(array, (_, coords) => sum(coords) >= 10)).toBe(false);
  expect(NDArray.nestedSomeFromLast(array, (_, coords) => sum(coords) <= 3)).toBe(true);
  expect(NDArray.nestedSomeFromLast(array, (_, coords) => sum(coords) < 0)).toBe(false);
  expect(NDArray.nestedSome(array, (_, coords) => sum(coords) >= 5, [1, 2, 0])).toBe(true);
  expect(NDArray.nestedSomeFromLast(array, (_, coords) => sum(coords) <= 3, [1, 3, 3])).toBe(true);
  expect(NDArray.nestedSome(array, (_, coords) => sum(coords) <= 3, [2, 1, 1])).toBe(false);
  expect(NDArray.nestedSomeFromLast(array, (_, coords) => sum(coords) >= 5, [0, 1, 3])).toBe(false);

  expect(NDArray.nestedEvery(array, (_, coords) => sum(coords) < 5)).toBe(false);
  expect(NDArray.nestedEvery(array, (_, coords) => sum(coords) < 10)).toBe(true);
  expect(NDArray.nestedEveryFromLast(array, (_, coords) => sum(coords) > 3)).toBe(false);
  expect(NDArray.nestedEveryFromLast(array, (_, coords) => sum(coords) >= 0)).toBe(true);
  expect(NDArray.nestedEvery(array, (_, coords) => sum(coords) < 5, [1, 2, 0])).toBe(false);
  expect(NDArray.nestedEveryFromLast(array, (_, coords) => sum(coords) > 3, [1, 3, 3])).toBe(false);
  expect(NDArray.nestedEvery(array, (_, coords) => sum(coords) > 3, [2, 1, 1])).toBe(true);
  expect(NDArray.nestedEveryFromLast(array, (_, coords) => sum(coords) < 5, [0, 1, 3])).toBe(true);
});
