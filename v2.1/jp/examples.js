const REQUEST_OPTIONS = {
    host: "jpdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET',
    agent: false
};

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?range=example&q=%QUERY%&page=%PAGE%";

const WHITESPACE = /[ \n\t]+/g;

const WORDLINK = /\[([^\[\]]+)\]/g;

function parseKR($, container) {
    return container.text().replace(WHITESPACE, " ").replace(WORDLINK, "").trim();
}

function parseJP($, container) {
    let text = container.find("span").remove(".player, .pin").end();
    text = require('./util.js').parseRuby(text, $).replace(WORDLINK, "").replace(WHITESPACE,  " ").trim();
    return text;
}

function parseResult(html, resolve) {
    let $ = require('cheerio').load(html);

    let examples = [];
    let exContainer = $("#content .section > ul > li");
    for (let i = 0; i <= exContainer.length - 1; i++) {
        let exItem = $(exContainer[i]);

        let original = $(exItem.children("p")[0]);
        let translated = $(exItem.children("p")[1]);

        if(original.has(".jp").length > 0) {
            original = parseJP($, original);
            translated = parseKR($, translated);
        } else {
            original = parseKR($, original);
            translated = parseJP($, translated);
        }

        let ex = {
            original: original,
            translated: translated
        }

        examples.push(ex);
    }

    resolve(examples);
}

function lookUp(query, page) {
    return new Promise((resolve, reject) => {
        let http = require('http');

        if (!page || page < 1) page = 1;

        REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));

        let req = http.request(REQUEST_OPTIONS, function(res) {
            res.setEncoding('utf8');
            var html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    parseResult(html, resolve);
                });
        });
        req.end();
    });
}

function serve(req, res) {

    let query = req.query.q;
    let page = req.query.page;

    if (query === undefined) {
        res.status(400).end();
        return;
    }

    lookUp(query, page)
        .then(result => {
            res.send(result);
        });
}

module.exports.route = serve;
