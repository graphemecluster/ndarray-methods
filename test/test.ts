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
  const values = [
    [[""], [""], [""], [""]],
    [[""], [""], [""], [""]],
    [[""], [""], [""], [""]],
  ];
  NDArray.nestedForEach(zeros, (_, coords) => (values[coords[0]][coords[1]][coords[2]] = coords.join("")));
  expect(values).toEqual(expected);
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
  const board = NDArray.nestedSplit([/(\r?\n|\r){3}/, /\r?\n|\r/, " ", ""], string);
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
  expect(NDArray.nestedJoin(["\n\n\n", "\n", " ", ""], board)).toBe(string);
});