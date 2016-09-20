const EXPRESS = require('express');
const app = EXPRESS();


const jsdom = require("jsdom");
const $ = require('jquery')(jsdom.jsdom().defaultView);

let bodyParser = require('body-parser');

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
                    extended: true
                }));

app.get("/kr", require("./kr.js").route);

const PORT = 80;
const HOST_LOCAL = "localhost";

app.listen(PORT, HOST_LOCAL, () => {
    console.log("Up and running!");
});
