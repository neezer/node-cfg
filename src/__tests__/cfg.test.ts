import * as fixtures from "./__fixtures__";

import fs from "fs-extra";
import path from "path";
import { cfg } from "../cfg";
import { withEnv } from "./helper";

test("simple config loads environment", () => {
  withEnv({ NODE_ENV: "test" }, () => {
    const config = cfg({
      onError: errors => expect(errors).toEqual([]),
      schema: fixtures.passingSimple
    });

    expect(config).toEqual(
      expect.objectContaining({
        env: "test"
      })
    );
  });
});

test("format array asserts inclusion", () => {
  expect.assertions(1);

  withEnv({ NODE_ENV: "bananas" }, () => {
    cfg({
      onError: errors => {
        expect(errors).toEqual([
          'env => "bananas" is not in "development,production,test"'
        ]);
      },
      schema: fixtures.passingSimple
    });
  });
});

test("format array asserts inclusion, case insensitive", () => {
  withEnv({ NODE_ENV: "TEST" }, () => {
    const config = cfg({
      onError: errors => expect(errors).toEqual([]),
      schema: fixtures.passingSimple
    });

    expect(config).toEqual(expect.objectContaining({ env: "test" }));
  });
});

test("simple config errors", () => {
  expect.assertions(1);

  withEnv({ NODE_ENV: undefined }, () => {
    cfg({
      onError: errors => {
        expect(errors).toEqual([
          'env => "undefined" is not in "development,production,test"'
        ]);
      },
      schema: fixtures.passingSimple
    });
  });
});

test("optional simple config does not error for optional properties", () => {
  withEnv({ NODE_ENV: undefined }, () => {
    const config = cfg({
      onError: errors => expect(errors).toEqual([]),
      schema: fixtures.optionalSimple
    });

    expect(config).toEqual(expect.objectContaining({ env: undefined }));
  });
});

test("handles deep config", () => {
  withEnv({ NODE_ENV: "test", LOG_LEVEL: "warn" }, () => {
    const config = cfg({
      onError: errors => expect(errors).toEqual([]),
      schema: fixtures.deep
    });

    expect(config).toEqual(
      expect.objectContaining({
        one: {
          logLevel: "warn",
          two: {
            three: "test"
          }
        }
      })
    );
  });
});

test("format boolean", () => {
  const isTrue = () => {
    const config = cfg({
      onError: errors => expect(errors).toEqual([]),
      schema: fixtures.formatBoolean
    });

    expect(config).toEqual(expect.objectContaining({ bool: true }));
  };

  const isFalse = () => {
    const config = cfg({
      onError: errors => expect(errors).toEqual([]),
      schema: fixtures.formatBoolean
    });

    expect(config).toEqual(expect.objectContaining({ bool: false }));
  };

  withEnv({ BOOL: "true" }, isTrue);
  withEnv({ BOOL: "t" }, isTrue);
  withEnv({ BOOL: "1" }, isTrue);
  withEnv({ BOOL: "false" }, isFalse);
  withEnv({ BOOL: "f" }, isFalse);
  withEnv({ BOOL: "0" }, isFalse);

  withEnv({ HOME: "/tmp/home" }, () => {
    const tomlConf = "bool = false";
    const HOME = process.env.HOME as string;

    const pathToFile = path.join(
      HOME,
      ".config",
      fixtures.formatBoolean.$appName,
      "env.toml"
    );

    fs.ensureFileSync(pathToFile);
    fs.writeFileSync(pathToFile, tomlConf, { encoding: "utf-8" });

    const config = cfg({
      onError: errors => expect(errors).toEqual([]),
      schema: fixtures.formatBoolean
    });

    expect(config).toEqual(expect.objectContaining({ bool: false }));

    return () => {
      fs.removeSync(
        path.join(HOME, ".config", fixtures.formatBoolean.$appName)
      );
    };
  });
});

describe("requiredWhen", () => {
  test("flags properties as required when true", () => {
    withEnv({ USE_TLS: "true", TLS_CERT_PATH: "/tmp/cert" }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.requiredWhen
      });

      expect(config).toEqual(
        expect.objectContaining({
          tls: {
            certPath: "/tmp/cert",
            use: true
          }
        })
      );
    });
  });

  test("throws error if required property is absent", () => {
    expect.assertions(1);

    withEnv({ USE_TLS: "true" }, () => {
      cfg({
        onError: errors => {
          expect(errors).toEqual([
            'value at "tls.certPath" cannot be undefined'
          ]);
        },
        schema: fixtures.requiredWhen
      });
    });
  });

  test("does not throw if false and property is absent", () => {
    withEnv({ USE_TLS: "false" }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.requiredWhen
      });

      expect(config).toEqual(
        expect.objectContaining({ tls: { use: false, certPath: undefined } })
      );
    });
  });
});

describe("format number", () => {
  test("formats a number value", () => {
    withEnv({ NUM: "42" }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.formatNumber
      });

      expect(config).toEqual(expect.objectContaining({ num: 42 }));
    });
  });

  test("throws if value is not a number", () => {
    expect.assertions(1);

    withEnv({ NUM: "fourty-two" }, () => {
      cfg({
        onError: errors => {
          expect(errors).toEqual(['"num" cannot be cast to a number']);
        },
        schema: fixtures.formatNumber
      });
    });
  });
});

describe("format url", () => {
  test("formats url", () => {
    const urlValue = "http://example.com:1234";
    const expectedUrl = new URL(urlValue);

    withEnv({ URL: urlValue }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.formatUrl
      });

      expect(config).toEqual(
        expect.objectContaining({
          url: expectedUrl
        })
      );
    });
  });

  test("throws if value is not a url", () => {
    expect.assertions(1);

    withEnv({ URL: "fourty-two" }, () => {
      cfg({
        onError: errors => {
          expect(errors).toEqual(['"url" cannot be cast to a URL']);
        },
        schema: fixtures.formatUrl
      });
    });
  });

  test("bundles up URL parts to return a url", () => {
    expect.assertions(1);

    const PORT = "8000";
    const HOST = "example.com";
    const PROTOCOL = "http";
    const PATH = "/bananas";
    const USER = "voldemort";
    const PASS = "nagini";
    const QUERY = "dark-wizard=true";

    const expectedUrl = new URL(
      `http://voldemort:nagini@example.com:8000/bananas?dark-wizard=true`
    );

    withEnv({ PORT, HOST, PROTOCOL, PATH, USER, PASS, QUERY }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.formatUrlFromParts
      });

      expect(config).toEqual({ url: expectedUrl });
    });
  });

  test("throws when critical parts are missing", () => {
    expect.assertions(2);

    const PROTOCOL = "http";
    const HOST = "example.com";

    withEnv({ HOST }, () => {
      cfg({
        onError: errors => {
          expect(errors).toEqual([
            '"url" cannot be cast to a URL; attempted to assemble from parts but the protocol is missing'
          ]);
        },
        schema: fixtures.formatUrlFromParts
      });
    });

    withEnv({ PROTOCOL }, () => {
      cfg({
        onError: errors => {
          expect(errors).toEqual([
            '"url" cannot be cast to a URL; attempted to assemble from parts but the host is missing'
          ]);
        },
        schema: fixtures.formatUrlFromParts
      });
    });
  });

  test("omits non-critical parts", () => {
    expect.assertions(1);

    const HOST = "example.com";
    const PROTOCOL = "http";
    const PATH = "/bananas";
    const USER = "voldemort";
    const expectedUrl = new URL(`http://voldemort@example.com/bananas`);

    withEnv({ HOST, PROTOCOL, PATH, USER }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.formatUrlFromParts
      });

      expect(config).toEqual(
        expect.objectContaining({
          url: expectedUrl
        })
      );
    });
  });
});

describe("format port", () => {
  test("formats port", () => {
    withEnv({ PORT: "80" }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.formatPort
      });

      expect(config).toEqual(expect.objectContaining({ port: 80 }));
    });
  });

  test("throws with invalid port", () => {
    withEnv({ PORT: "4.5" }, () => {
      cfg({
        onError: errors => {
          expect(errors).toEqual(['"port" is not a valid port']);
        },
        schema: fixtures.formatPort
      });
    });
  });
});

describe("format path", () => {
  test("formats path", () => {
    const p = "/tmp/something";

    fs.ensureFileSync(p);

    withEnv({ PATHY: p }, () => {
      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.formatPath
      });

      expect(config).toEqual(expect.objectContaining({ path: p }));

      return () => {
        fs.removeSync(p);
      };
    });
  });

  test("fails if path doesn't exist", () => {
    const p = "/this/path/does/not/exist";

    withEnv({ PATHY: p }, () => {
      cfg({
        onError: errors => {
          expect(errors).toEqual([`for path, no file present at ${p}`]);
        },
        schema: fixtures.formatPath
      });
    });
  });
});

describe("XDG config", () => {
  const tomlConf = `
port = 8888

[nested]
key = "testing"
`;

  test("loads from $HOME", () => {
    withEnv({ HOME: "/tmp/home" }, () => {
      const HOME = process.env.HOME as string;

      const pathToFile = path.join(
        HOME,
        ".config",
        fixtures.xdg.$appName,
        "env.toml"
      );

      fs.ensureFileSync(pathToFile);
      fs.writeFileSync(pathToFile, tomlConf, { encoding: "utf-8" });

      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.xdg
      });

      expect(config).toEqual(
        expect.objectContaining({ port: 8888, nested: { key: "testing" } })
      );

      return () => {
        fs.removeSync(path.join(HOME, ".config", fixtures.xdg.$appName));
      };
    });
  });

  test("loads from $XDG_CONFIG_HOME", () => {
    withEnv({ XDG_CONFIG_HOME: "/tmp/.config" }, () => {
      const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME as string;

      const pathToFile = path.join(
        XDG_CONFIG_HOME,
        fixtures.xdg.$appName,
        "env.toml"
      );

      fs.ensureFileSync(pathToFile);
      fs.writeFileSync(pathToFile, tomlConf, { encoding: "utf-8" });

      const config = cfg({
        onError: errors => expect(errors).toEqual([]),
        schema: fixtures.xdg
      });

      expect(config).toEqual(expect.objectContaining({ port: 8888 }));

      return () => {
        fs.removeSync(
          path.join(XDG_CONFIG_HOME, ".config", fixtures.xdg.$appName)
        );
      };
    });
  });
});

// test("loads config from XDG config if $appName is set", (t: Test) => {
//   const tomlConf = `
// port = 8888

// [nested]
// key = "testing"
// `;

//   withEnv({ XDG_CONFIG_HOME: "/tmp/.config" }, () => {
//     const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME as string;
//     const pathToFile = path.join(XDG_CONFIG_HOME, xdg.$appName, "env.toml");

//     fs.ensureFileSync(pathToFile);
//     fs.writeFileSync(pathToFile, tomlConf, { encoding: "utf-8" });

//     const config = cfg({
//       onError: errors => t.fail(errors.join(" ")),
//       schema: xdg
//     });

//     t.equal(config.port, 8888, "port is valid");

//     return () => {
//       fs.removeSync(path.join(XDG_CONFIG_HOME, ".config", xdg.$appName));
//     };
//   });

//   t.end();
// });
