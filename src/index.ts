type NDArray<T> = (T | NDArray<T>)[];

function isCallable(unknown: unknown): unknown is Function {
  return typeof unknown === "function";
}
function assertNonEmpty(array: unknown[]) {
  if (!array.length) throw new Error("Array length must not be zero.");
}
const isArray = Array.isArray;
/*
return rest.length
  ? Array.from({ length }, (_, index) =>
      methods.buildShape(rest, (...indices: number[]) => valueOrMapfn(index, ...indices), thisArg)
    )
  : Array.from({ length }, (_, index) =>
      ((...indices: number[]) => valueOrMapfn(index, ...indices)).call(thisArg)
    );
return rest.length
  ? Array.from({ length }, () => methods.buildShape(rest, valueOrMapfn))
  : Array.from({ length }, () => valueOrMapfn);
*/

class Methods {
  buildShape<T>(array: number[], value: T): NDArray<T>;
  buildShape<T>(array: number[], mapfn: (...indices: number[]) => T, thisArg?: any): NDArray<T>;
  buildShape<T>(array: number[], valueOrMapfn: T | ((...indices: number[]) => T), thisArg?: any) {
    assertNonEmpty(array);
    return isCallable(valueOrMapfn)
      ? (function recursive(parent: number[], mapfn: (...indices: number[]) => T): NDArray<T> {
          const [length, ...rest] = parent;
          return rest.length
            ? Array.from({ length }, (_, index) => recursive(rest, (...indices: number[]) => mapfn(index, ...indices)))
            : Array.from({ length }, (_, index) => mapfn.call(thisArg, index));
        })(array, valueOrMapfn)
      : (function recursive(parent: number[], value: T): NDArray<T> {
          const [length, ...rest] = parent;
          return rest.length
            ? Array.from({ length }, () => recursive(rest, value))
            : Array.from({ length }, () => value);
        })(array, valueOrMapfn);
  }

  nestedMap<T>(
    array: NDArray<T>,
    callbackfn: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => T,
    thisArg?: any
  ) {
    return (function recursive(parent: NDArray<T>, indices: number[]): NDArray<T> {
      return parent.map((value, index) =>
        isArray(value)
          ? recursive(value, indices.concat(index))
          : callbackfn.call(thisArg, value, indices.concat(index), array, parent)
      );
    })(array, []);
  }

  nestedForEach<T>(
    array: NDArray<T>,
    callbackfn: (value: T, index: number[], array: NDArray<T>, parent: NDArray<T>) => T,
    thisArg?: any
  ) {
    (function recursive(parent: NDArray<T>, indices: number[]) {
      parent.forEach((value, index) => {
        isArray(value)
          ? recursive(value, indices.concat(index))
          : callbackfn.call(thisArg, value, indices.concat(index), array, parent);
      });
    })(array, []);
  }

  nestedSplit(separators: (string | RegExp)[], content: string) {
    assertNonEmpty(separators);
    return (function recursive(parent: (string | RegExp)[], content: string): NDArray<string> {
      const [first, ...rest] = parent;
      return rest.length ? content.split(first).map(value => recursive(rest, value)) : content.split(first);
    })(separators, content);
  }

  nestedJoin(separators: string[], content: NDArray<string>) {
    return (function recursive(parent: NDArray<string>, axis: number): string {
      return parent.map(value => (isArray(value) ? recursive(value, axis + 1) : value)).join(separators[axis]);
    })(content, 0);
  }

  shape(array: NDArray<unknown>) {
    const shape: number[] = [];
    (function recursive(parent: NDArray<unknown>, axis: number) {
      if (typeof shape[axis] !== "number" || shape[axis] < parent.length) shape[axis] = parent.length;
      parent.forEach(value => {
        if (isArray(value)) recursive(value, axis + 1);
      });
    })(array, 0);
    return shape;
  }

  nestedIncludes<T>(array: NDArray<T>, searchElement: T) {
    /*
    return (function recursive(parent: NDArray<T>): boolean {
      return parent.findIndex(value => (isArray(value) ? recursive(value) : value === searchElement)) !== -1;
    })(array);
    */
    return (function recursive(parent: NDArray<T>): boolean {
      for (let index = 0; index < parent.length; index++) {
        const value = parent[index];
        if (isArray(value)) {
          if (recursive(value)) return true;
        } else if (value === searchElement) return true;
      }
      return false;
    })(array);
  }

  nestedIndexOf<T>(array: NDArray<T>, searchElement: T) {
    /*
    return (function recursive(parent: NDArray<T>, indices: number[]): number[] | undefined {
      const index = parent.findIndex((value, index) =>
        isArray(value) ? typeof recursive(value, indices.concat(index)) !== "undefined" : value === searchElement
      );
      return index === -1 ? undefined : indices.concat(index);
    })(array, []);
    */
    return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
      for (let index = 0; index < parent.length; index++) {
        const value = parent[index];
        const newIndices = indices.concat(index);
        if (isArray(value)) {
          const result = recursive(value, newIndices);
          if (result[0]) return result;
        } else if (value === searchElement) return [true, newIndices];
      }
      return [false];
    })(array, [])[1];
  }

  nestedFind<T>(
    array: NDArray<T>,
    predicate: (value: T, index: number[], obj: NDArray<T>, parent: NDArray<T>) => unknown,
    thisArg?: any
  ) {
    return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, T] {
      for (let index = 0; index < parent.length; index++) {
        const value = parent[index];
        if (isArray(value)) {
          const result = recursive(value, indices.concat(index));
          if (result[0]) return result;
        } else if (predicate.call(thisArg, value, indices.concat(index), array, parent)) return [true, value];
      }
      return [false];
    })(array, [])[1];
  }

  nestedFindIndex<T>(
    array: NDArray<T>,
    predicate: (value: T, index: number[], obj: NDArray<T>, parent: NDArray<T>) => unknown,
    thisArg?: any
  ) {
    /*
    return (function recursive(parent: NDArray<T>, indices: number[]): number[] | undefined {
      const index = parent.findIndex((value, index) =>
        isArray(value)
          ? typeof recursive(value, indices.concat(index)) !== "undefined"
          : predicate.call(thisArg, value, indices.concat(index), array, parent)
      );
      return index === -1 ? undefined : indices.concat(index);
    })(array, []);
    */
    return (function recursive(parent: NDArray<T>, indices: number[]): [false] | [true, number[]] {
      for (let index = 0; index < parent.length; index++) {
        const value = parent[index];
        const newIndices = indices.concat(index);
        if (isArray(value)) {
          const result = recursive(value, newIndices);
          if (result[0]) return result;
        } else if (predicate.call(thisArg, value, newIndices, array, parent)) return [true, newIndices];
      }
      return [false];
    })(array, [])[1];
  }
}

export default Methods.prototype;
