const EXPRESS = require('express');
const app = EXPRESS();

const compression = require('compression');

let parseArgs = require('minimist');
let aliases = {
    "p": "port",
    "port": "port"
};
const ARGS = parseArgs(process.argv.slice(2), {
    alias: aliases
});

console.log("Started with arguments:");
console.log("\tport:", ARGS.port);
console.log();

let bodyParser = require('body-parser');

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.use(compression());


//Bindings for old API on default URI
{
    let API = 1;
    let paths = require("./v1.0");
    app.get("/kr", paths.kr.words);
    app.get("/kr/details", paths.kr.details);
    app.get("/kr/ex", paths.kr.examples)

    app.get("/jp", paths.jp.words);
    app.get("/jp/details", paths.jp.details);
    app.get("/jp/ex", paths.jp.examples);

    app.get("/en", paths.en.words);
}

//Bindings for current API on new URI
{
    let API = 2;
    let paths = {
        kr: require("./kr"),
        jp: require("./jp"),
        en: require("./en")
    };
    app.get("/v" + API + "/kr", paths.kr.words);
    app.get("/v" + API + "/kr/details", paths.kr.details);
    app.get("/v" + API + "/kr/ex", paths.kr.examples)

    app.get("/v" + API + "/jp", paths.jp.words);
    app.get("/v" + API + "/jp/details", paths.jp.details);
    app.get("/v" + API + "/jp/ex", paths.jp.examples);

    app.get("/v" + API + "/en", paths.en.words);
    app.get("/v" + API + "/en", require("./en").words);
    app.get("/v" + API + "/en/details", require("./en").details);
}

const PORT = process.env.PORT || ARGS.port || 80;

var server = app.listen(PORT, () => {
    console.log("Server running at " + server.address().address + server.address().port);
});
