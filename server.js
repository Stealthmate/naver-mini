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

app.listen(80, () => {
    console.log("Up and running!");
});
