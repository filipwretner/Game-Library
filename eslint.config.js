// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Single root ESLint config applied to every workspace.
 * Prettier owns formatting; ESLint owns correctness + architecture.
 * The `no-restricted-imports` overrides turn the spec's layering rules
 * (§7.4 / §8.4 / §12.2) into build-time guarantees.
 */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/build/**', '**/coverage/**', '**/node_modules/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  sonarjs.configs.recommended,
  prettier,

  // Type-aware linting for all TS via the project service.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': [
        'warn',
        {
          // HTTP status codes are well-known; everything else gets a named constant.
          ignore: [-1, 0, 1, 200, 201, 204, 400, 404, 409, 500],
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
      // Cognitive-complexity / size caps — a flag means "extract a function".
      complexity: ['warn', 12],
      'max-depth': ['warn', 3],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      'sonarjs/cognitive-complexity': ['warn', 12],
    },
  },

  // Config / script files: relax project-service + node globals.
  {
    files: ['**/*.config.{js,ts}', '**/*.cjs'],
    languageOptions: { globals: { ...globals.node } },
    extends: [tseslint.configs.disableTypeChecked],
    rules: { '@typescript-eslint/no-magic-numbers': 'off' },
  },

  // ── Architectural boundaries (dependencies point inward only) ──

  // shared/ and backend domain/: pure — no Prisma, Express, or React.
  {
    files: ['shared/**/*.ts', 'backend/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@prisma/client', message: 'Pure layer: no Prisma. Keep I/O in repositories.' },
            { name: 'express', message: 'Pure layer: no Express. Keep HTTP in http/.' },
            { name: 'react', message: 'Pure layer: no React. Domain logic stays framework-free.' },
          ],
          patterns: [
            {
              group: ['react', 'react-*', '@prisma/*', 'express'],
              message: 'Pure layer must stay I/O- and framework-free.',
            },
          ],
        },
      ],
    },
  },

  // backend services/: depend on ports (interfaces) only — never PrismaClient or concrete providers.
  {
    files: ['backend/src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@prisma/client', message: 'Services use repository ports, not PrismaClient.' },
          ],
          patterns: [
            {
              group: ['**/repositories/prisma/**'],
              message: 'Inject the repository port, not the Prisma impl.',
            },
            {
              group: ['**/integrations/igdb/**', '**/integrations/cheapshark/**'],
              message: 'Inject the provider port, not the concrete client.',
            },
          ],
        },
      ],
    },
  },

  // frontend components/: presentational only — reach the API layer through hooks, never directly.
  {
    files: ['frontend/src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/api/**', '../api/*', '../../api/*'],
              message: 'Components are presentational: call hooks, not the api/ layer.',
            },
          ],
        },
      ],
    },
  },

  // Tests: allow magic numbers and longer functions.
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      'sonarjs/no-duplicate-string': 'off',
      // supertest/response bodies are typed `any`; assertions on them are fine in tests.
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
