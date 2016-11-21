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

const WORDLINK = /\[([^\[\]]+)\]/g;

let Util = require("../util.js");

function parseKR($, container) {
    return Util.shrink(container.text()).replace(WORDLINK, "").trim();
}

function parseJP($, container) {
    let text = container.find("span").remove(".player, .pin").end();
    text = require('./jputil.js').parseRuby(text, $).replace(WORDLINK, "");
    text = Util.shrink(text);
    return text;
}

function parseResult(html) {
    let $ = require('cheerio').load(html);

    let examples = [];
    let exContainer = $("#content .section > ul > li");
    for (let i = 0; i <= exContainer.length - 1; i++) {
        let exItem = $(exContainer[i]);

        let original = $(exItem.children("p")[0]);
        let keyword = exItem.children("p").find(".pin a").text();
        keyword = Util.shrink(keyword);
        let translated = $(exItem.children("p")[1]);

        let from = "JP";
        let to = "KR";

        if (original.has(".jp").length > 0) {
            original = parseJP($, original);
            translated = parseKR($, translated);
        } else {
            original = parseKR($, original);
            translated = parseJP($, translated);
            from = "KR";
            to = "JP";
        }

        let TranslatedExample = require("../models/TranslatedExample.js");

        examples.push(new TranslatedExample(from, to, keyword, original, translated));
    }

    return examples;
}

function lookUp(query, page) {
    if (!page || page < 1) page = 1;

    REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));

    return Util.queryNaver(REQUEST_OPTIONS)
        .then(html => {
            return parseResult(html);
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
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({}).end();
        });
}

module.exports.serve = serve;
