module.exports = {
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json"
        }
    },
    moduleFileExtensions: [
        "ts",
        "js",
        "d.ts",
    ],
    "modulePaths": [
        "<rootDir>"
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    testMatch: [
        "**/*.test.(ts|js)"
    ],
    testEnvironment: "node"
};
