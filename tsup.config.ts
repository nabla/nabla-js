import { readFileSync, writeFileSync } from "fs";
import { defineConfig } from "tsup";

import packageJson from "./package.json";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  format: "esm",
  dts: true,
  sourcemap: true,
  entry: ["src/index.ts", "src/messaging/index.ts"],
  platform: "browser",
  target: ["safari13"],
  clean: true,
  onSuccess: () => {
    // We are copying the package.json to the dist folder with only
    // what's needed for a production env
    writeJsonFileSync("dist/package.json", {
      name: packageJson.name,
      description: packageJson.description,
      license: packageJson.license,
      version: packageJson.version,
      dependencies: packageJson.dependencies,
      keywords: packageJson.keywords,
      type: packageJson.type,
      author: packageJson.author,
      main: packageJson.main,
      repository: packageJson.repository,
      peerDependencies: packageJson.peerDependencies,
      peerDependenciesMeta: packageJson.peerDependenciesMeta,
    });

    // Create a package.json file for the messaging sub module
    writeJsonFileSync("dist/messaging/package.json", {
      name: "@nabla/js/messaging",
      type: "module",
      main: "index.js",
      types: "index.d.ts",
    });

    writeFileSync("dist/README.md", readFileSync("README.md", "utf-8"));

    return Promise.resolve();
  },
});

const writeJsonFileSync = (file: string, json: object) => {
  writeFileSync(file, JSON.stringify(json, null, 2));
};
