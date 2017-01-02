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

let bodyParser = require('body-parser');

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.use(compression());


//Bindings for website view
{
    const viewfolder = './views/';


    app.get("/", (req, res) => {
        res.sendFile(viewfolder + "index.html", {
            root: __dirname
        });
    })

    const fs = require('fs');
    fs.readdir(viewfolder, (err, files) => {
        files.forEach(file => {
            app.get("/" + file, (req, res) => {
                res.sendFile(viewfolder + file, {
                    root: __dirname
                });
            })

        });
    })
}

//Bindings for docs
{
    app.get("/doc", (req, res) => {
        require("fs").readFile("apiary.apib", {encoding: "utf8"}, (err, data) => {
            var blueprint = data;
            var options = {
              themeVariables: 'default'
            };
            let aglio = require("aglio");
            aglio.render(blueprint, options, function (err, html, warnings) {
                if (err) return console.log(err);
                let keys = Object.keys(warnings);
                if (keys.length !== 1 || keys[0] !== "input") console.log("WARNING", warnings);

                res.send(html).end();
            });
        })
    });

    app.set("view-engine", "ejs");

    app.get("/doc/schemas", (req, res) => {
        require("./docs/jsonschemas").reload();
        let schemas = require("./docs/jsonschemas").schemas;
        let test = require("./jsonschemarenderer.js").render(schemas[0]);
        res.render("docs/schemas.ejs", {schemas: schemas, test: test});
    });
}

//Bindings for new API on default URI
{
    let paths = {
        kr: require("./kr"),
        jp: require("./jp"),
        en: require("./en"),
        hj: require("./hj")
    };
    app.get("/kr", paths.kr.words);
    app.get("/kr/details", paths.kr.details);
    app.get("/kr/ex", paths.kr.examples)
    app.get("/jp", paths.jp.words);
    app.get("/jp/details", paths.jp.details);
    app.get("/jp/ex", paths.jp.examples);

    app.get("/en", paths.en.words);
    app.get("/en/details", paths.en.details);
    app.get("/en/ex", paths.en.examples);

    app.get("/hj", paths.hj.hanja);
    app.get("/hj/details", paths.hj.details);
}

//Bindings for old API on v2 URI
{
    let API = 2;
    let paths = require("./v2.1");
    app.get("/v" + API + "/kr", paths.kr.words);
    app.get("/v" + API + "/kr/details", paths.kr.details);
    app.get("/v" + API + "/kr/ex", paths.kr.examples)

    app.get("/v" + API + "/jp", paths.jp.words);
    app.get("/v" + API + "/jp/details", paths.jp.details);
    app.get("/v" + API + "/jp/ex", paths.jp.examples);

    app.get("/v" + API + "/en", paths.en.words);
    app.get("/v" + API + "/en/details", paths.en.details);
}

const PORT = process.env.PORT || ARGS.port || 80;

var server = app.listen(PORT, () => {
    console.log("Server running at " + server.address().address + server.address().port);
});
