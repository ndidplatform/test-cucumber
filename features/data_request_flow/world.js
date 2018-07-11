var { setWorldConstructor } = require("cucumber");

const lib = require("../support/world.js");

setWorldConstructor(lib.World);