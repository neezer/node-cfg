export function withEnv(env: NodeJS.ProcessEnv, cb: () => void) {
  const oldEnv = process.env;

  process.env = env;

  cb();

  process.env = oldEnv;
}
