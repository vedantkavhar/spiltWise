import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

//Angular ESLint packages (modern Angular support)
import angularEslintPlugin from "@angular-eslint/eslint-plugin";
import angularTemplatePlugin from "@angular-eslint/eslint-plugin-template";
import angularTemplateParser from "@angular-eslint/template-parser";

export default defineConfig([
  // Base JavaScript rules
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },

  // TypeScript rules
  {
    files: ["**/*.{ts,mts,cts}"],
    ...tseslint.configs.recommended,
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  //  Angular (modern) support
  {
    files: ["**/*.ts"],
    plugins: {
      "@angular-eslint": angularEslintPlugin,
    },
    extends: ["plugin:@angular-eslint/recommended"],
  },

  //  Angular HTML templates
  {
    files: ["**/*.html"],
    plugins: {
      "@angular-eslint/template": angularTemplatePlugin,
    },
    // languageOptions: {
    //   parser: angularTemplateParser,
    // },
    extends: ["plugin:@angular-eslint/template/recommended"],
  },

  // Import sorting
  {
    files: ["**/*.{ts,mts,cts}"],
    plugins: { import: importPlugin },
    rules: {
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
    },
  },

  // CSS linting
  {
    files: ["**/*.css"],
    rules: {
      indent: ["error", 2],
      "no-duplicate-selectors": "error",
    },
  },

  // Prettier integration
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,html,css}"],
    plugins: { prettier },
    extends: ["plugin:prettier/recommended"],
    rules: {
      "prettier/prettier": "error",
    },
  },

  // Ignore patterns
  {
    ignores: ["node_modules/", "dist/", "**/*.spec.ts"],
  },
]);
