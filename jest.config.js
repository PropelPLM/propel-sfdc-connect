module.exports = {
  transform: {
      "^.+\\.js$": "babel-jest"
  },
  testEnvironment: "node",
  roots: [
      "<rootDir>/lib",
      "<rootDir>/test"
  ]
};
