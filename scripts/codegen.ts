import { readFileSync, writeFileSync } from "fs";
import { generate } from "@graphql-codegen/cli";

await generate({
  schema: "./../../graphql/patient/patient-sdk.graphql",
  documents: ["./graphql/*.graphql"],
  generates: {
    "./src/__generated__/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
      },
      plugins: [],
      config: {
        scalars: {
          UUID: "string",
          BigDecimal: "number",
          DateTime: "ISOString",
          TimeZone: "TimeZone",
        },
        strictScalars: true,
      },
    },
  },
  ignoreNoDocuments: true,
});

writeFileSync(
  "./src/__generated__/graphql.ts",
  readFileSync("./src/env.d.ts", "utf-8") +
    readFileSync("./src/__generated__/graphql.ts", "utf-8"),
);
