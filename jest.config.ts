module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
    ],
    transform: {
        '^.+\\.(t|j)sx?$': ['@swc/jest']
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!test/**/*.ts',
    ],
    testTimeout: 60000, // 60 seconds for testcontainers
    maxWorkers: 1, // Run tests sequentially to avoid port conflicts
}; 