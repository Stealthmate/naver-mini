const TranslatedExample = require("../models/TranslatedExample.js");

const REQUEST_OPTIONS = {
    host: "krdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET',
    agent: false
};

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?kind=example&query=%QUERY%&page=%PAGE%";

const Util = require("../util.js");

function parseResult(html) {
    let $ = require('cheerio').load(html);

    let examples = [];
    let exContainer = $("#content .section > ul > li");
    for (let i = 0; i <= exContainer.length - 1; i++) {
        let exItem = $(exContainer[i]);
        let keyword = exItem.find("span.ex > a > strong").text();
        keyword = Util.shrink(keyword);
        let ex = exItem.find("span").remove(".ex").end().text();
        ex = Util.shrink(ex);
        examples.push(new TranslatedExample(TranslatedExample.LANGS.KR, TranslatedExample.LANGS.KR, keyword, ex, null).getCompressed());
    }

    return examples;
}

function lookUp(query, page) {
    let http = require('http');

    if (!page || page < 1) page = 1;

    REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));

    return Util.queryNaver(REQUEST_OPTIONS)
        .then((html) => {
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
