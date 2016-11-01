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
    let API = 1.0;
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
    let API = 2.0;
    let paths = {
        kr: require("./kr"),
        jp: require("./jp"),
        en: require("./en")
    };
    app.get("/" + API + "/kr", paths.kr.words);
    app.get("/" + API + "/kr/details", paths.kr.details);
    app.get("/" + API + "/kr/ex", paths.kr.examples)

    app.get("/" + API + "/jp", paths.jp.words);
    app.get("/" + API + "/jp/details", paths.jp.details);
    app.get("/" + API + "/jp/ex", paths.jp.examples);

    app.get("/" + API + "/en", paths.en.words);
}




const PORT = process.env.PORT || ARGS.port || 80;

var server = app.listen(PORT, () => {
    console.log("Server running at " + server.address().address + server.address().port);
});
