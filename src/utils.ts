// http://gomakethings.com/merging-objects-with-vanilla-javascript/
// NOTE: original script had lots of typos; fixed here
export function extend(...args: any[]) {
  const extended: Record<string, any> = {};

  let deep = false;
  let i = 0;

  if (typeof args[0] === "boolean") {
    deep = args[0];
    i++;
  }

  const merge = (obj: any) => {
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        const shouldRecurse =
          deep &&
          Object.prototype.toString.call(obj[prop]) === "[object Object]";

        extended[prop] = shouldRecurse
          ? extend(true, extended[prop], obj[prop])
          : obj[prop];
      }
    }
  };

  for (; i < args.length; i++) {
    merge(args[i]);
  }

  return extended;
}
