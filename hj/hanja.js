const HanjaEntry = require("../models/HanjaEntry.js");

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search/keyword?query=" + QUERY + "&page=" + PAGE;

const REQUEST_OPTIONS = {
    host: "hanja.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const Util = require("../util.js");

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    let name = header.find(".fnt15").children("sup").remove().end().text();
    headerobj.word = name.replace(/\(.*\)/, "").trim();
    headerobj.hanja = name.substring(name.indexOf('(') + 1, name.indexOf(')')).trim();
    headerobj.pronun = header.find(".pronun").text();
    return headerobj;
}

function parseMoreInfo(link) {
    let str = link;
    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(str.indexOf("/openkr"));
    return str;
}

function parseHanja(sec, $) {
    let hjlist = [];

    let hanjas = sec.children("dt");
    let hanjadefs = sec.children("dd");

    for (let i = 0; i <= hanjas.length - 1; i++) {

        let hanja = $(hanjas[i]).text();
        hanja = Util.shrink(hanja);
        let hjdef = $(hanjadefs[i]);

        let readings = hjdef.children("a").eq(0).text();
        readings = Util.shrink(readings).split(" ");

        let meaning = hjdef.children(".meaning").text();
        meaning = Util.shrink(meaning);
        let meanings = meaning.split(/[0-9]\. /).slice(1);

        let radical = hjdef.children(".sub_info").find("li").eq(0).find("span").text();
        radical = Util.shrink(radical);
        let strokes = hjdef.children(".sub_info").find("li").eq(1).children().remove().end().text();
        strokes = parseInt(Util.shrink(strokes).substring(0, strokes.length - 1));
        let difficulty = hjdef.children(".sub_info").find("li").eq(2).children().remove().end().text();
        difficulty = Util.shrink(difficulty);

        hjlist.push(new HanjaEntry(
            hanja,
            readings,
            radical,
            strokes,
            null,
            difficulty,
            meanings,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            true
        ).getCompressed());
    }

    return hjlist;
}

function parseResult(html) {
    let $ = require('cheerio').load(html);

    let sections = $("#content > div.result_chn_chr");

    return parseHanja(sections.find("dl"), $);
}

function lookUp(query, page) {
    let http = require('http');

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

module.exports.route = serve;
