/**
 * Jest config.
 *
 * Les tests ciblent la LOGIQUE MÉTIER PURE (src/logic), sans dépendance React
 * Native : on reste donc sur l'environnement node, plus rapide et déterministe.
 * La transformation TypeScript est assurée par babel-preset-expo (via jest-expo).
 */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};
