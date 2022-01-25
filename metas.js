const fs = require('fs');
const vm = require('vm');

var data = fs.readFileSync('/config/config.js');
var script = new vm.Script(data);
script.runInThisContext();

var metas = config.metas;
metas.url = process.env.PUBLIC_URL;

if (process.argv.length <= 2) {
    console.log('Usage: node metas.js template.html');
    process.exit(1);
}

var template = Object.keys(metas).reduce((acc, key) => {
    const re = new RegExp(`{${key}}`, 'g');
    return acc.replace(re, metas[key]);
}, fs.readFileSync(process.argv[2]).toString());

console.log(template);
