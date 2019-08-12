import { URL } from "url";
import { Assert } from ".";
import { AssembleFrom } from "../schema";

export const assert: Assert = (keyPath, value, _, optional) => {
  try {
    const parsed = new URL(value);

    return [null, parsed];
  } catch (_) {
    if (optional !== undefined && optional.assembleFrom !== undefined) {
      const { assembleFrom: assembleMap } = optional;

      const mapKeys = [
        "host",
        "protocol",
        "username",
        "password",
        "search",
        "pathname",
        "port"
      ];

      const assemble: AssembleFrom = mapKeys.reduce(
        (memo, key) => {
          const envKey = assembleMap[key];

          return envKey === undefined
            ? memo
            : { ...memo, [key]: process.env[envKey] };
        },
        {
          host: "",
          protocol: ""
        }
      );

      if (assemble.protocol === undefined) {
        return [
          `"${keyPath}" cannot be cast to a URL; attempted to assemble from parts but the protocol is missing`,
          false
        ];
      }

      if (assemble.host === undefined) {
        return [
          `"${keyPath}" cannot be cast to a URL; attempted to assemble from parts but the host is missing`,
          false
        ];
      }

      try {
        const url = new URL(`${assemble.protocol}://${assemble.host}`);

        if (assemble.port) {
          url.port = assemble.port;
        }

        if (assemble.username) {
          url.username = assemble.username;
        }

        if (assemble.password) {
          url.password = assemble.password;
        }

        if (assemble.pathname) {
          url.pathname = assemble.pathname;
        }

        if (assemble.search) {
          url.search = assemble.search;
        }

        return [null, url];
      } catch (_) {
        return [
          `"${keyPath}" cannot be cast to a URL; attempted to assemble from parts but failed for an unknown reason`,
          false
        ];
      }
    }

    return [`"${keyPath}" cannot be cast to a URL`, false];
  }
};
