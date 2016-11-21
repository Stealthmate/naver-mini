var ejs = require('ejs'),
    fs = require('fs'),
    rendered = ejs.renderFile("./template.ejs", {schema: require("../docs/jsonschemas/exampleentry.js")}, {}, (err, output) => {
        fs.writeFileSync("text.html", output);
    });
