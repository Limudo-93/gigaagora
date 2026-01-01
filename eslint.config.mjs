import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...next,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
