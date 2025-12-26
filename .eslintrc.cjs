module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended'
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh', 'react'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true }
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

        // 🚨 HARD ENFORCEMENT: NO HARDCODED TEXT IN JSX
        'react/jsx-no-literals': [
            'error',
            {
                noStrings: true,
                allowedStrings: [
                    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                    '+', '-', '*', '/', '=', '%',
                    '×', '•', '→', '←', '↑', '↓', '✓', '✗', '✕', '✔', '✖', '✨',
                    '|', ':', ';', ',', '.', '!', '?',
                    '$', '€', '£', '¥', 'CDF',
                    ''
                ],
                ignoreProps: true,
                noAttributeStrings: false
            }
        ]
    }
};
