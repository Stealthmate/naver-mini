const TranslatedExample = require("../models/TranslatedExample.js");

const REQUEST_OPTIONS = {
    host: "endic.naver.com",
    port: 80,
    path: "/",
    method: 'GET',
    agent: false
};

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search_example.nhn?sLn=en&query=" + QUERY + "&pageNo=" + PAGE;

const WORDLINK = /\[([^\[\]]+)\]/g;

const Util = require("../util.js");

function parseResult(html) {
    let $ = require('cheerio').load(html);

    let examples = [];
    let exContainer = $("#exampleAjaxArea > ul > li");
    for (let i = 0; i <= exContainer.length - 1; i++) {
        let exItem = $(exContainer[i]);

        let keyword = exItem.children("div").eq(0).children("span").eq(1).find("b").eq(0).text();
        keyword = Util.shrink(keyword);

        let original = exItem.children("div").eq(0).children("span").eq(1).text();
        original = Util.shrink(original);
        let translated = $(exItem.children("div")[1]).text();
        translated = Util.shrink(translated);

        let from = TranslatedExample.LANGS.EN;
        let to = TranslatedExample.LANGS.KR;

        examples.push(new TranslatedExample(from, to, keyword, original, translated).getCompressed());
    }

    return examples;
}

function lookUp(query, page) {
    let http = require('http');

    if (!page || page < 1) page = 1;

    REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));

    return Util.queryNaver(REQUEST_OPTIONS)
        .then(html => {
            return parseResult(html);
        })
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
