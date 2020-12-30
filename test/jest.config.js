module.exports = {
    collectCoverage: true,
    rootDir: './../',
    collectCoverageFrom: ["<rootDir>/model/*.js"],
    verbose: true,
    "preset": "@shelf/jest-mongodb"
};
