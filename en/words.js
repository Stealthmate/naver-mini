const EnWordEntry = require("../models/EnWordEntry.js");

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?sLn=en&query=" + QUERY + "&searchOption=entry_idiom";

const REQUEST_OPTIONS = {
    host: "endic.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WORDCLASS = /(^|\n)[\[\(][^\[\]\)\(]+[\]\)]/g;

const Util = require("../util.js");

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    headerobj.word = Util.shrink(header.find("a").text());
    headerobj.kanji = Util.shrink(header.find("span.sw > span.jp").text());
    return headerobj;
}

function parseDefinitions(items, $) {
    let deflist = [];

    let defs = items.find("dt");

    for (let i = 0; i <= defs.length - 1; i++) {

        let def = $(defs[i]);
        def = def.children("a").remove().end();

        let word = def.children().eq(0).children().eq(0).find("sup").remove().end().text();
        word = Util.shrink(word);

        let more = def.children().eq(0).children().eq(0).attr("href").replace(/&query=[^&]*/, "");

        let pronun = def.children("span").eq(1).text();
        pronun = Util.shrink(pronun);
        if (pronun.indexOf("[") < 0) pronun = "";
        pronun = pronun.replace(/[\[\]]/g, "");
        pronun = pronun.replace("|", "'");

        let hanja = null;
        if (!pronun) hanja = Util.shrink(def.children().eq(0).children().remove().end().text());

        let defd = $(def.nextUntil("dt").children("div").children("p")[0]);
        let meaningContainer = $(defd.children("span")[0]).nextUntil("img");
        let meaning = ($(defd.children("span")[0]).text() + meaningContainer.text());
        meaning = Util.shrink(meaning);

        if (meaning.length == 0) meaning = Util.shrink(defd.text());

        let wordclasses = meaning.match(WORDCLASS) || [];

        if (wordclasses != null) {
            for (let j = 0; j <= wordclasses.length - 1; j++) {
                meaning = meaning.replace(wordclasses[j], "");
                wordclasses[j] = wordclasses[j].replace(/[\[\]\(\)]/g, "");
            }
            if (meaning.length == 0 && wordclasses.length == 1) {
                meaning = wordclasses[0];
                wordclasses[0] = "";
            }
        }

        let enWord = meaning.substring(0, meaning.indexOf("|"));
        if (enWord) meaning = meaning.replace(enWord + "|", "").trim();

        if (more.charAt(0) == "/") more = more.substring(1);
        if(more.indexOf("userEntry") >= 0) {
            more = "http://endic.naver.com/" + more;
        }

        if (meaning.length > 0) {
            deflist.push(new EnWordEntry(
                word,
                pronun,
                hanja, [new EnWordEntry.EnWordClassGroup(wordclasses.join(";"), [new EnWordEntry.EnMeaning(meaning, null)])],
                true,
                more + "&sLn=en"
            ).getCompressed());
        }
    }

    return deflist;
}

function parseResult(html) {
    let $ = require('cheerio').load(html);
    return parseDefinitions($(".word_num_nobor > dl"), $);
}

function lookUp(query, page) {

    if (page < 1) page = 1;

    REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));

    return Util.queryNaver(REQUEST_OPTIONS)
        .then(html => {
            return parseResult(html);
        });
}

function serve(req, res) {
    let query = req.query.q;
    let page = req.query.page;
    if (page === undefined) page = 1;

    if (query === undefined && page === undefined) {
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
