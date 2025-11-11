import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node }, rules: { "no-unused-vars": "warn", "react/react-in-jsx-scope": "off" }, settings: { react: { version: "detect" } } },
  pluginReact.configs.flat.recommended,
]);
