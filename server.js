const EXPRESS = require('express');
const app = EXPRESS();

const compression = require('compression');

let parseArgs = require('minimist');
let aliases = {
    "p": "port",
    "port": "port"
};
const ARGS = parseArgs(process.argv.slice(2), {alias: aliases});

console.log("Started with arguments:");
console.log("\tport:", ARGS.port);
console.log();

let bodyParser = require('body-parser');

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
                    extended: true
                }));

app.use(compression());

app.get("/kr", require("./kr").words);
app.get("/kr/details", require("./kr").details);
app.get("/kr/ex", require("./kr").examples)

app.get("/jp", require("./jp").words);
app.get("/jp/details", require('./jp').details);
app.get("/jp/ex", require('./jp').examples);

app.get("/en", require("./en").words);

const PORT = process.env.PORT || ARGS.port || 80;

var server = app.listen(PORT, () => {
    console.log("Server running at " + server.address().address + server.address().port);
});
