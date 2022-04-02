import * as Library from "./main";
import { buildShape, nestedSplit, nestedJoin } from "./main";

Object.entries(Library).forEach(([name, method]) => {
  if (!(name in Array.prototype))
    Object.defineProperty(Array.prototype, name, {
      value(...args: unknown[]) {
        return (method as Function)(this, ...args);
      },
    });
});

Object.entries({ fromShape: buildShape, nestedSplit, nestedJoin }).forEach(([name, value]) => {
  if (!(name in Array)) Object.defineProperty(Array, name, { value });
});

// prettier-ignore
export { Infinity, NDArray, MDArray, ArrayOfLength, BuildIndices, Indices, Shape, Map, ElementType, Access, Parent, Cast, Narrow } from ".";
