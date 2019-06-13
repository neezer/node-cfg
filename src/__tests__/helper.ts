const noop = () => {
  // empty
};

export function withEnv(env: NodeJS.ProcessEnv, cb: () => void | (() => void)) {
  const oldEnv = process.env;

  process.env = env;

  const cleanup = cb() || noop;

  process.env = oldEnv;

  cleanup();
}
