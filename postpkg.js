
const fs = require("fs");
const {version} = require("./package.json");
var AdmZip = require('adm-zip');


const nombre = `ytpad_${version}`;
const outPath = `./build/${nombre}`;

fs.renameSync("./build/pkg.exe", `${outPath}.exe`);


const zip = new AdmZip();
zip.addLocalFile(`${outPath}.exe`);
zip.writeZip(`${outPath}.zip`);

