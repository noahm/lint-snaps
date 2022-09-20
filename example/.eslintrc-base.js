/**
 * This is the base level of config needed in order for eslint
 * to run against this sample typescript/react example.
 *
 * Foth .eslintrc.js and .eslint-snaps.js extend this file.
 */
module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    "import/extensions": [".ts", ".tsx"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};
