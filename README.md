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
import { cfg } from "@neezer/cfg";

interface MyConfig {
  aValue: string;
}

// use a typeguard to definitely type your config
const assertType = (value: any): value is MyConfig => {
  return !!value && "aValue" in value;
};

// given `process.env.A_VALUE === 'whatever'`

const config = cfg<MyConfig>(undefined, assertType);

config.aValue === "whatever";
```

## TODO

Write more here
