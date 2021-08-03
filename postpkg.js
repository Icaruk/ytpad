
const fs = require("fs");
const {version} = require("./package.json");


const nombre = `ytpad_${version}.exe`;

fs.renameSync("./build/pkg.exe", `./build/${nombre}`);
