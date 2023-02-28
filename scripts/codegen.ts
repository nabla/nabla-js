import { readFileSync, writeFileSync } from "fs";
import { generate } from "@graphql-codegen/cli";

await generate({
  schema: "./../../graphql/patient/patient-sdk.graphql",
  config: {
    scalars: {
      UUID: "GqlUuid",
      BigDecimal: "number",
      DateTime: "ISOString",
      TimeZone: "TimeZone",
    },
    strictScalars: true,
    dedupeFragments: true,
  },
  generates: {
    "./src/__generated__/": {
      documents: ["./src/graphql/*.graphql", "./graphql/shared.graphql"],
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
        fragmentMasking: false,
      },
      plugins: [],
    },
    "./src/messaging/__generated__/": {
      documents: [
        "./src/messaging/graphql/*.graphql",
        "./graphql/shared.graphql",
      ],
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
        fragmentMasking: false,
      },
      plugins: [],
    },
  },
  ignoreNoDocuments: true,
});

writeFileSync(
  "./src/__generated__/graphql.ts",
  readFileSync("./src/env.d.ts", "utf-8") +
    readFileSync("./src/__generated__/graphql.ts", "utf-8"),
);
