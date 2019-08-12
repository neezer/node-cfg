# @neezer/cfg

[![Build Status](https://travis-ci.org/neezer/node-cfg.svg?branch=master)](https://travis-ci.org/neezer/node-cfg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

`cfg` is a library to manage loading configuration into your Node JS
application. There are many, many libraries that do this already, but they
missed some key functionality I was after:

- Ability to mark variables as optional based on the values of other variables
- JSON-based schema
- Rich Typescript config object
- Configure using XDG-based TOML

`cfg` offers all of that.

## Usage

**config.json** in your project root:

```json
{
  "aValue": {
    "desc": "A configuration value",
    "env": "A_VALUE",
    "format": "string"
  }
}
```

```ts
/* given `process.env.A_VALUE === 'whatever'` */

import { cfg } from "@neezer/cfg";

// dynamically generated on NPM/yarn install
// if using in a JS project, you can skip this import
import { Config } from "@neezer/cfg/dist/config";

const config = cfg<Config>();

config.aValue === "whatever";
```

### A note about errors

By default, `cfg` will log configuration errors to `stderr` and will exit the
process with `process.exit(1)`. You can configure this behavior using the
`onError` configuration option.

However, be advised that if you do not properly handle errors, the resulting
config object may be in a bad state. I like failing hard when this happens to
prevent more cryptic errors, which is why the default is so aggressive.

## Example `config.json`

```json
{
  "boolean": {
    "desc": "A value that will be evaluated to `true` or `false`",
    "env": "BOOL",
    "format": "boolean"
  },
  "number": {
    "desc": "A value that will be evaluated as a Number",
    "env": "NUMBER",
    "format": "number"
  },
  "path": {
    "desc": "A value representing a file path. cfg will check that a file exists at the path given, and throw an error if it doesn't. The return value is the given string.",
    "env": "PATH",
    "format": "path"
  },
  "port": {
    "desc": "A value that will be returned as a number. It must be greater than or equal to 0 and less than or equal to 65535, and it must be an integer.",
    "env": "PORT",
    "format": "port"
  },
  "url": {
    "desc": "A value that will be evaluated as a WHATWG URL object, which will be the return value.",
    "env": "URL",
    "format": "url"
  },
  "inclusion": {
    "desc": "A value that will be tested for equality against the values provided to `format`.",
    "env": "INCLUSION",
    "format": ["one", "two", "three"]
  },
  "any": {
    "desc": "A value that does not specify `format` in one of the above cases will be evaluated as a string.",
    "env": "ANY",
    "format": "whatever"
  }
}
```

The following properties are optional on any config entity:

| property        | description                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| caseInsensitive | will downcase the input before doing any validation                                                                                               |
| optional        | will not emit an error if the value fails `format` validation                                                                                     |
| requiredWhen    | will mark this value as required when the value for this property is evaluated to `true`. Note that the target value must be `format: "boolean"`. |
| assembleFrom    | only valid for URLs, provide a map to build a URL value by parts. See below                                                                       |

### `requiredWhen` Example

```json
{
  "check-me": {
    "desc": "the check value",
    "env": "A",
    "format": "boolean"
  },
  "b": {
    "desc": "the b value",
    "env": "B",
    "format": "string",
    "requiredWhen": "check-me"
  }
}
```

```ts
/**
 * process.env.A === 1
 * process.env.B === 'bananas'
 */
const config = cfg();

config["check-me"] === true;
config.b === "bananas";

/**
 * process.env.A === 0
 */
const config = cfg();

config["check-me"] === false;
config.b === undefined;

/**
 * process.env.A === 1
 */
const config = cfg();

// will exit and emit the error
//
//     value at "b" cannot be undefined
```

### `assembleFrom` Example

**NOTE**: This only affects URL values when `format` is set to `url`.

Sometimes you can't provide a connection string and have to build it up by
parts, specified as individual environment variables. For those cases, you can
provide the `assembleFrom` configuration option, which accepts a map like this:

```json
{
  "url-in-parts": {
    "desc": "a url in parts",
    "env": "URL",
    "format": "url",
    "assembleFrom": {
      "host": "URL_HOST",
      "port": "URL_PORT",
      "protocol": "URL_PROTO",
      "username": "URL_USER",
      "password": "URL_PASS",
      "search": "URL_QUERY_PARAMS",
      "pathname": "URL_PATH"
    }
  }
}
```

`cfg` will check to see if the value provided at `URL` is valid, but if it is
not and `assembleFrom` is present, it will attempt to build a URL from the parts
specified in the map. The values in the map are the environment variables you
want to use for each part of the URL: the keys are fixed.

If successfull, the final result will be a URL as if you had provided a value
for `URL`.

**NOTE**: No verification is done on the environment variables listed in
`assembleFrom` before they are passed to the URL constructor internally; they're
all read in as simple strings.

## Migrating from 2.x.x to 3.x.x

### Automagic Config Type Definition

Previously you had to define a type to pass to `cfg`, along with a type guard
function and an assert function.

Now that all happens automatically at **package install time** via a
`postinstall` hook. You don't have to pass in the type--`cfg` will still work
fine without it--but you can get better type safety and better autocomplete
functionality in your editor if you use it.

If you need to regenerate the definition, you can manually invoke the script:

```shell
./node_modules/.bin/cfg
```

#### Why at package install time?

TypeScript does not allow inference of rich JS objects at runtime. While you're
authoring your application you haven't "ran" it yet, but the compile step for
the library has already "run," so there's no opportunity to provide a richer
type object in a dynamic fashion. This library cannot anticipate all possible
user-generated configurations, which is why the previous API put that work on
you--the consumer--to provide to the library.

I always thought it sucked that the type guard and type definition was basically
a copy of the config JSON this library consumes. Too much opportunity for the
two to drift apart. I was also unhappy with the generic Record type of
`Record<string, any>` since you couldn't write smarter types with that limited
information and I really love my VSCode autocompletion.

So this is the happy medium. The compile process for the lib knows nothing about
your schema--and thus your config type--but the TypeScript compiler for your
application should know about your schema without a bunch of work on your part.

If anyone knows of a better way to implement this, I'm all :ear:s.

### Configure error handling with `onError`

The return from `cfg` now only returns the config object, not the errors.
Configure error handling using the `onError` configuration option.

## Migrating from 1.x.x to 2.x.x

The arguments provided to `cfg` are now an object:

```diff
- cfg(givenSchemaMap, assertType)
+ cfg({ schema: givenSchemaMap, check: assertType })
```
