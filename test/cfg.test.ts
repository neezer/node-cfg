import fs from "fs-extra";
import path from "path";
import test, { Test } from "tape";
import { cfg } from "../src/cfg";
import deep from "./fixtures/deep.json";
import formatBoolean from "./fixtures/format-boolean.json";
import formatNumber from "./fixtures/format-number.json";
import formatPort from "./fixtures/format-port.json";
import optionalSimple from "./fixtures/optional-simple.json";
import passingSimple from "./fixtures/passing-simple.json";
import requiredWhen from "./fixtures/required-when.json";
import xdg from "./fixtures/xdg.json";
import { withEnv } from "./helper";

test("simple config loads environment", (t: Test) => {
  withEnv({ NODE_ENV: "test" }, () => {
    const [errors, config] = cfg({ schema: passingSimple });

    t.deepEqual(errors, null, "errors is null");

    if (config !== null) {
      t.ok(config.hasOwnProperty("env"), "config has env key");
      t.equal(config.env, "test", "value is correct");
    }

    t.end();
  });
});

test("format array asserts inclusion", (t: Test) => {
  withEnv({ NODE_ENV: "bananas" }, () => {
    const [errors, _] = cfg({ schema: passingSimple });

    if (errors === null) {
      t.fail("must return error");
    } else {
      t.equal(errors.length, 1, "has one error");

      const error = errors[0];

      t.equal(
        error,
        'env => "bananas" is not in "development,production,test"',
        "message is correct"
      );
    }

    t.end();
  });
});

test("format array asserts inclusion, case insensitive", (t: Test) => {
  withEnv({ NODE_ENV: "TEST" }, () => {
    const [errors, config] = cfg({ schema: passingSimple });

    if (errors === null) {
      t.equal(config.env, "test", "env === test");
    } else {
      t.fail("expected success");
    }

    t.end();
  });
});

test("simple config errors", (t: Test) => {
  withEnv({ NODE_ENV: undefined }, () => {
    const [errors, _] = cfg({ schema: passingSimple });

    if (errors === null) {
      t.fail("must return errors");
    } else {
      t.equal(errors.length, 1, "has one error");

      const error = errors[0];

      t.equal(
        error,
        'env => "undefined" is not in "development,production,test"'
      );
    }

    t.end();
  });
});

test("optional simple config does not error for optional properties", (t: Test) => {
  withEnv({ NODE_ENV: undefined }, () => {
    const [errors, config] = cfg({ schema: optionalSimple });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.deepEqual(config, { env: undefined }, "value is undefined");
    }

    t.end();
  });
});

test("handles deep config", (t: Test) => {
  withEnv({ NODE_ENV: "test", LOG_LEVEL: "warn" }, () => {
    const [errors, config] = cfg({ schema: deep });

    if (errors !== null) {
      t.fail("must not return errors");
    } else {
      t.ok(config.hasOwnProperty("one"), "has one key");
      t.ok(config.one.hasOwnProperty("logLevel"), "one has log level");
      t.ok(config.one.hasOwnProperty("two"), "one has two");
      t.ok(config.one.two.hasOwnProperty("three"), "one.two has three");
      t.deepEqual(config.one.logLevel, "warn", "log level is correct");
      t.deepEqual(config.one.two.three, "test", "env is correct");
    }

    t.end();
  });
});

test("format boolean", (t: Test) => {
  const isTrue = () => {
    const [errors, config] = cfg({ schema: formatBoolean });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.equal(config.bool, true, "bool is true");
    }
  };

  const isFalse = () => {
    const [errors, config] = cfg({ schema: formatBoolean });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.equal(config.bool, false, "bool is false");
    }
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
    const [errors, config] = cfg({ schema: requiredWhen });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.ok(config.hasOwnProperty("tls"), "has tls property");
      t.ok(config.tls.hasOwnProperty("use"), "tls.use exists");
      t.ok(config.tls.hasOwnProperty("certPath"), "tls.certPath exists");
      t.equal(config.tls.use, true, "use tls is true");
      t.equal(config.tls.certPath, "/tmp/cert", "tls.certPath is correct");
    }
  });

  withEnv({ USE_TLS: "true" }, () => {
    const [errors, _] = cfg({ schema: requiredWhen });

    if (errors === null) {
      t.fail("should have errors");
    } else {
      t.equal(errors.length, 1, "has one error");
      t.equal(
        errors[0],
        'value at "tls.certPath" cannot be undefined',
        "message is correct"
      );
    }
  });

  withEnv({}, () => {
    const [errors, config] = cfg({ schema: requiredWhen });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.ok(config.hasOwnProperty("tls"), "has tls property");
      t.ok(config.tls.hasOwnProperty("use"), "tls.use exists");
      t.ok(config.tls.hasOwnProperty("certPath"), "tls.certPath exists");
      t.equal(config.tls.use, false, "use tls is false");
      t.equal(config.tls.certPath, undefined, "tls.certPath is correct");
    }
  });

  t.end();
});

test("format number", (t: Test) => {
  withEnv({ NUM: "42" }, () => {
    const [errors, config] = cfg({ schema: formatNumber });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.equal(config.num, 42, "num is a number");
    }
  });

  withEnv({ NUM: "fourty-two" }, () => {
    const [errors] = cfg({ schema: formatNumber });

    if (errors === null) {
      t.fail("no errors");
    } else {
      t.equal(
        errors[0],
        '"num" cannot be cast to a number',
        "number is invalid"
      );
    }
  });

  t.end();
});

test("format port", (t: Test) => {
  withEnv({ PORT: "80" }, () => {
    const [errors, config] = cfg({ schema: formatPort });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.equal(config.port, 80, "port is valid");
    }
  });

  withEnv({ PORT: "4.5" }, () => {
    const [errors] = cfg({ schema: formatPort });

    if (errors === null) {
      t.fail("no errors");
    } else {
      t.equal(errors[0], '"port" is not a valid port', "port is invalid");
    }
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

    const [errors, config] = cfg({ schema: xdg });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.equal(config.port, 8888, "port is valid");
      t.equal(config.nested.key, "testing", "nested key works");
    }

    fs.removeSync(path.join(HOME, ".config", xdg.$appName));
  });

  withEnv({ XDG_CONFIG_HOME: "/tmp/.config" }, () => {
    const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME as string;
    const pathToFile = path.join(XDG_CONFIG_HOME, xdg.$appName, "env.toml");

    fs.ensureFileSync(pathToFile);
    fs.writeFileSync(pathToFile, tomlConf, { encoding: "utf-8" });

    const [errors, config] = cfg({ schema: xdg });

    if (errors !== null) {
      t.fail(JSON.stringify(errors));
    } else {
      t.equal(config.port, 8888, "port is valid");
    }

    fs.removeSync(path.join(XDG_CONFIG_HOME, xdg.$appName));
  });

  t.end();
});
