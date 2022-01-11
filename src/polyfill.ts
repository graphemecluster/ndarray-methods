import * as Library from "./main";

Object.entries(Library).forEach(([name, method]) => {
  if (!(name in Array.prototype))
    Object.defineProperty(Array.prototype, name, {
      value(...args: unknown[]) {
        return (method as Function)(this, ...args);
      },
    });
});

export { NDArray, MDArray, BuildIndices, Indices, Shape, Map, ElementType, Access, Parent } from ".";
