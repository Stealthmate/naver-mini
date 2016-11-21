const EnWordEntry = require("../models/EnWordEntry.js");

const REQUEST_OPTIONS = {
    host: "endic.naver.com",
    port: 80,
    path: "/",
    method: 'GET'
};

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const Util = require("../util.js");

function parseDefs($, container, keyword) {

    let dts = container.children("dt");
    let defsArr = [];

    for (let j = 0; j <= dts.length - 1; j++) {

        let defobj = {};

        let def = $(dts[j]).children("span").eq(0).remove().end();
        let eng = def.find("i").eq(0).text();
        eng = Util.shrink(eng);
        let mean = def.children("em").find(".fnt_intro").remove().end().find(".blind").remove().end().text();
        mean = Util.shrink(mean);

        let exarr = [];

        let examples = $(dts[j]).nextUntil("dt");
        for (let k = 0; k <= examples.length - 1; k++) {

            let exobj = {};

            let dd = $(examples[k]);
            let ex = dd.children("p").eq(0).text();
            ex = Util.shrink(ex);
            let translated = dd.children("p").eq(1).text();
            translated = Util.shrink(translated);

            let from = EnWordEntry.TranslatedExample.KR;
            let to = EnWordEntry.TranslatedExample.EN;

            if(dd.children("p").eq(0).attr("lang") === "en") {
                from = EnWordEntry.TranslatedExample.EN;
                to = EnWordEntry.TranslatedExample.KR;
            }

            exarr.push(new EnWordEntry.TranslatedExample(from, to, keyword, ex, translated));
        }

        defsArr.push(new EnWordEntry.EnMeaning(mean, eng, exarr));
    }

    return defsArr;
}

function parseDetailsFromKr(html) {
    let $ = require('cheerio').load(html);

    let resultObj = {};

    let title = $("#content .word_view");
    let word = title.find(".tit strong").text();
    word = Util.shrink(word);
    resultObj.word = word;

    let hanja = title.find(".tit span").children().remove().end().text();
    hanja = Util.shrink(hanja);
    if (hanja) resultObj.extra = hanja;

    resultObj.clsgrps = [];
    resultObj.clsgrps.push(
        new EnWordEntry.EnWordClassGroup(
            null,
            parseDefs(
                $,
                $("#zoom_content").children("div").children("dl.list_a11"),
                word)));

    return resultObj;
}

function parseDetailsFromEnIdiom(html) {
    let $ = require('cheerio').load(html);

    let resultObj = {};
    return parseDetailsFromEn(html);
}

function parseDetailsFromEn(html) {
    let $ = require('cheerio').load(html);

    let resultObj = {};

    let title = $("#content .word_view");

    let word = title.find(".tit h3").text();
    word = Util.shrink(word);
    resultObj.word = word;

    let pronun = title.find(".pron em").children().eq(0).text();
    pronun = Util.shrink(pronun);
    if (pronun) resultObj.pronun = pronun;

    resultObj.clsgrps = [];

    let wclassSections = $("#zoom_content .box_wrap1, .box_wrap24").eq(0).has("dl");

    for (let i = 0; i <= wclassSections.length - 1; i++) {
        let content = $(wclassSections[i]);
        resultObj.clsgrps.push(new EnWordEntry.EnWordClassGroup(content.find("h3").text(), parseDefs($, content.find("dl"), word)));
    }

    return resultObj;
}

function lookUp(link) {
    let http = require('http');

    REQUEST_OPTIONS.path = "/" + link;

    return Util.queryNaver(REQUEST_OPTIONS)
        .then(html => {
            let result = null;
            if (link.indexOf("en") == 0) {
                if (link.indexOf("Idiom") < 0) result = parseDetailsFromEn(html);
                else result = parseDetailsFromEnIdiom(html);
            } else result = parseDetailsFromKr(html);

            return new EnWordEntry(
                result.word,
                result.pronun,
                result.hanja,
                result.clsgrps,
                false,
                link.replace(/&?sLn=[^&]*&?/, "")
            ).getCompressed();
        });
}

function serve(req, res) {

    let link = decodeURIComponent(req.query.lnk);
    let page = undefined;
    let pagesize = undefined;
    if ('page' in req.query) page = parseInt(req.query.page) - 1;
    if ('pagesize' in req.query) pagesize = parseInt(req.query.pagesize);

    lookUp(link)
        .then(result => {

            let response = result;

            if (page >= 0) {

                let psize = 5;
                if (pagesize > 0) psize = pagesize;

                let reslen = result.length;
                let start = (psize * page);
                let end = start + psize;
                if (end < reslen) {
                    response = result.slice(start, end);
                } else {
                    response = result.slice(start, result.length);
                }
            }
            res.send(response);
        })
        .catch(err => {
            res.status(500).send({}).end();
        });
}

module.exports.serve = serve;
