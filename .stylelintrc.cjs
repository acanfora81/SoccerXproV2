// .stylelintrc.cjs
module.exports = {
  extends: [
    "stylelint-config-tailwindcss"
  ],
  rules: {
    // Regole di base valide per Stylelint 16
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": true,
    "no-duplicate-selectors": true,
    "no-invalid-double-slash-comments": true,
    "declaration-block-single-line-max-declarations": 1,
    
    // Regole di formattazione moderne
    "selector-class-pattern": "^[a-z](?:[a-z0-9-]*[a-z0-9])?$", // naming coerente: solo kebab-case
    "alpha-value-notation": "percentage", // es: 0.5 → 50%
    "color-function-notation": "modern",  // es: rgb(0 0 0 / 50%)
    "font-weight-notation": "numeric",    // es: 700 invece di bold
    "color-named": "never", // non usare colori nominati come 'white', 'black'
    
    // Regole di specificità
    "no-descending-specificity": true,
    
    // Disabilita regole che confliggono con Tailwind CSS
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer"
        ]
      }
    ]
  },
  ignoreFiles: [
    "node_modules/**/*",
    "dist/**/*",
    "build/**/*",
    ".storybook/**/*"
  ]
};
