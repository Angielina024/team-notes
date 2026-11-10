export interface Debounced<A extends unknown[]> {
    (...args: A): void;
    cancel(): void;
  }
  
  export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): Debounced<A> {
    let timer: ReturnType<typeof setTimeout> | undefined;
  
    const debounced = (...args: A): void => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        fn(...args);
      }, ms);
    };
  
    debounced.cancel = (): void => {
      clearTimeout(timer);
      timer = undefined;
    };
  
    return debounced;
  }
  
  export function once<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    let called = false;
    let result: R;
  
    return (...args: A): R => {
      if (!called) {
        called = true;
        result = fn(...args);
      }
      return result;
    };
  }
  