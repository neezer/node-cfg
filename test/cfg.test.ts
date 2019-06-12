import fs from "fs-extra";
import path from "path";
import test, { Test } from "tape";
import { cfg } from "../src/cfg";
import deep from "./fixtures/deep.json";
import formatBoolean from "./fixtures/format-boolean.json";
import formatNumber from "./fixtures/format-number.json";
import formatPath from "./fixtures/format-path.json";
import formatPort from "./fixtures/format-port.json";
import formatUrl from "./fixtures/format-url.json";
import optionalSimple from "./fixtures/optional-simple.json";
import passingSimple from "./fixtures/passing-simple.json";
import requiredWhen from "./fixtures/required-when.json";
import xdg from "./fixtures/xdg.json";
import { withEnv } from "./helper";

test("simple config loads environment", (t: Test) => {
  withEnv({ NODE_ENV: "test" }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join("\n")),
      schema: passingSimple
    });

    t.ok(config.hasOwnProperty("env"), "config has env key");
    t.equal(config.env, "test", "value is correct");
  });

  t.end();
});

test("format array asserts inclusion", (t: Test) => {
  let errored = false;

  withEnv({ NODE_ENV: "bananas" }, () => {
    cfg({
      onError: errors => {
        errored = true;

        t.equal(errors.length, 1, "has one error");

        const error = errors[0];

        t.equal(
          error,
          'env => "bananas" is not in "development,production,test"',
          "message is correct"
        );
      },
      schema: passingSimple
    });

    t.equals(errored, true, "should have failed");
  });

  t.end();
});

test("format array asserts inclusion, case insensitive", (t: Test) => {
  withEnv({ NODE_ENV: "TEST" }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join("\n")),
      schema: passingSimple
    });

    t.equal(config.env, "test", "env === test");
  });

  t.end();
});

test("simple config errors", (t: Test) => {
  let errored = false;

  withEnv({ NODE_ENV: undefined }, () => {
    cfg({
      onError: errors => {
        errored = true;

        t.equal(errors.length, 1, "has one error");

        const error = errors[0];

        t.equal(
          error,
          'env => "undefined" is not in "development,production,test"'
        );
      },
      schema: passingSimple
    });

    t.equals(errored, true, "should have failed");
  });

  t.end();
});

test("optional simple config does not error for optional properties", (t: Test) => {
  withEnv({ NODE_ENV: undefined }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: optionalSimple
    });

    t.deepEqual(config, { env: undefined }, "value is undefined");
  });

  t.end();
});

test("handles deep config", (t: Test) => {
  withEnv({ NODE_ENV: "test", LOG_LEVEL: "warn" }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: deep
    });

    t.ok(config.hasOwnProperty("one"), "has one key");
    t.ok(config.one.hasOwnProperty("logLevel"), "one has log level");
    t.ok(config.one.hasOwnProperty("two"), "one has two");
    t.ok(config.one.two.hasOwnProperty("three"), "one.two has three");
    t.deepEqual(config.one.logLevel, "warn", "log level is correct");
    t.deepEqual(config.one.two.three, "test", "env is correct");
  });

  t.end();
});

test("format boolean", (t: Test) => {
  const isTrue = () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: formatBoolean
    });

    t.equal(config.bool, true, "bool is true");
  };

  const isFalse = () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: formatBoolean
    });

    t.equal(config.bool, false, "bool is false");
  };

  withEnv({ BOOL: "true" }, isTrue);
  withEnv({ BOOL: "t" }, isTrue);
  withEnv({ BOOL: "1" }, isTrue);
  withEnv({ BOOL: "false" }, isFalse);
  withEnv({ BOOL: "f" }, isFalse);
  withEnv({ BOOL: "0" }, isFalse);
  withEnv({}, isFalse);

  t.end();
});

test("requiredWhen are required when other property is truthy", (t: Test) => {
  withEnv({ USE_TLS: "true", TLS_CERT_PATH: "/tmp/cert" }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: requiredWhen
    });

    t.ok(config.hasOwnProperty("tls"), "has tls property");
    t.ok(config.tls.hasOwnProperty("use"), "tls.use exists");
    t.ok(config.tls.hasOwnProperty("certPath"), "tls.certPath exists");
    t.equal(config.tls.use, true, "use tls is true");
    t.equal(config.tls.certPath, "/tmp/cert", "tls.certPath is correct");
  });

  withEnv({ USE_TLS: "true" }, () => {
    let errored = false;

    cfg({
      onError: errors => {
        errored = true;

        t.equal(errors.length, 1, "has one error");
        t.equal(
          errors[0],
          'value at "tls.certPath" cannot be undefined',
          "message is correct"
        );
      },
      schema: requiredWhen
    });

    t.equal(errored, true, "should have errors");
  });

  withEnv({}, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: requiredWhen
    });

    t.ok(config.hasOwnProperty("tls"), "has tls property");
    t.ok(config.tls.hasOwnProperty("use"), "tls.use exists");
    t.ok(config.tls.hasOwnProperty("certPath"), "tls.certPath exists");
    t.equal(config.tls.use, false, "use tls is false");
    t.equal(config.tls.certPath, undefined, "tls.certPath is correct");
  });

  t.end();
});

test("format number", (t: Test) => {
  withEnv({ NUM: "42" }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: formatNumber
    });

    t.equal(config.num, 42, "num is a number");
  });

  withEnv({ NUM: "fourty-two" }, () => {
    let errored = false;

    cfg({
      onError: errors => {
        errored = true;

        t.equal(
          errors[0],
          '"num" cannot be cast to a number',
          "number is invalid"
        );
      },
      schema: formatNumber
    });

    t.equal(errored, true, "should have errored");
  });

  t.end();
});

test("format url", (t: Test) => {
  const urlValue = "http://example.com:1234";
  const expectedUrl = new URL(urlValue);

  withEnv({ URL: urlValue }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: formatUrl
    });

    t.ok(config.url instanceof URL, "url is a URL instance");
    t.equal(config.url.port, expectedUrl.port, "port matches");
  });

  withEnv({ URL: "fourty-two" }, () => {
    let errored = false;

    cfg({
      onError: errors => {
        errored = true;

        t.equal(errors[0], '"url" cannot be cast to a URL', "url is invalid");
      },
      schema: formatUrl
    });

    t.equal(errored, true, "should have errored");
  });

  t.end();
});

test("format port", (t: Test) => {
  withEnv({ PORT: "80" }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: formatPort
    });

    t.equal(config.port, 80, "port is valid");
  });

  withEnv({ PORT: "4.5" }, () => {
    let errored = false;

    cfg({
      onError: errors => {
        errored = true;

        t.equal(errors[0], '"port" is not a valid port', "port is invalid");
      },
      schema: formatPort
    });

    t.equal(errored, true, "should have errored");
  });

  t.end();
});

test("format path", (t: Test) => {
  const failPath = "/this/does/not/exist";

  fs.ensureFileSync("/tmp/something");

  withEnv({ PATHY: "/tmp/something" }, () => {
    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: formatPath
    });

    t.equal(config.path, "/tmp/something", "path is valid");
  });

  withEnv({ PATHY: failPath }, () => {
    let errored = false;

    cfg({
      onError: errors => {
        errored = true;

        t.equal(
          errors[0],
          `no file present at ${failPath}`,
          "path does not exist"
        );
      },
      schema: formatPath
    });

    t.equal(errored, true, "should have errored");
  });

  t.end();
});

test("loads config from XDG config if $appName is set", (t: Test) => {
  const tomlConf = `
port = 8888

[nested]
key = "testing"
`;

  withEnv({ HOME: "/tmp/home" }, () => {
    const HOME = process.env.HOME as string;
    const pathToFile = path.join(HOME, ".config", xdg.$appName, "env.toml");

    fs.ensureFileSync(pathToFile);
    fs.writeFileSync(pathToFile, tomlConf, { encoding: "utf-8" });

    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: xdg
    });

    t.equal(config.port, 8888, "port is valid");
    t.equal(config.nested.key, "testing", "nested key works");

    fs.removeSync(path.join(HOME, ".config", xdg.$appName));
  });

  withEnv({ XDG_CONFIG_HOME: "/tmp/.config" }, () => {
    const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME as string;
    const pathToFile = path.join(XDG_CONFIG_HOME, xdg.$appName, "env.toml");

    fs.ensureFileSync(pathToFile);
    fs.writeFileSync(pathToFile, tomlConf, { encoding: "utf-8" });

    const config = cfg({
      onError: errors => t.fail(errors.join(" ")),
      schema: xdg
    });

    t.equal(config.port, 8888, "port is valid");

    fs.removeSync(path.join(XDG_CONFIG_HOME, xdg.$appName));
  });

  t.end();
});
