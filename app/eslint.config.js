import eslintPluginSvelte from 'eslint-plugin-svelte'
import globals from "globals"
import pluginJs from "@eslint/js"


export default [
  {
    ignores: ["dist/"],
  },
  ...eslintPluginSvelte.configs['flat/recommended'],
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  {
    rules: {
      'no-self-assign': 'off',
      'semi': ['error', 'never'],
      'svelte/require-each-key': 'off',
      'svelte/no-dom-manipulating': 'off',
      'no-unused-vars': ['error', {
        'args': 'none',
        'caughtErrors': 'none'
      }],
    },
  },
]