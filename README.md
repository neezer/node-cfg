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
import { Config } from "@neezer/cfg/dist/config";

const [errors, config] = cfg<Config>();

config.aValue === "whatever";
```

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
./node_modules/.bin/cfg-extrude
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

## Migrating from 1.x.x to 2.x.x

The arguments provided to `cfg` are now an object:

```diff
- cfg(givenSchemaMap, assertType)
+ cfg({ schema: givenSchemaMap, check: assertType })
```

## TODO

Write more here
