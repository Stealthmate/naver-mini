const KrWordEntry = require("../models/KrWordEntry.js");

const REQUEST_OPTIONS = {
    host: "krdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET',
    agent: false
};

const MARK_PRONUN = "발음";

const Util = require("../util.js");

function parseDetails(html) {
    let $ = require('cheerio').load(html);

    let titleArea = $(".spot_area#wordArea h3");

    let hanja = titleArea.find(".cha").text();
    hanja = Util.shrink(hanja);
    let pronun = titleArea.children("em:contains('" + MARK_PRONUN + "')").text();
    pronun = Util.shrink(pronun);
    pronun = pronun.substring(pronun.indexOf(": ") + 2, pronun.length - 1);

    let word = titleArea.children().remove().end().text();
    word = Util.shrink(word);

    let wordclass = $("#meanArea h4").text();
    wordclass = Util.shrink(wordclass)

    let glosses = $("dl.lst > dt");
    let examplelists = $("dl.lst > dd");

    let glossesobjs = [];

    for (let i = 0; i <= glosses.length - 1; i++) {
        let glossobj = {};
        glossobj.def = $(glosses[i]).find(".title").children("strong").text();
        glossobj.def = Util.shrink(glossobj.def);
        glossobj.ex = [];
        let exlist = $(examplelists[i]).find(".lst_mean > li");
        for (let j = 0; j <= exlist.length - 1; j++) {
            glossobj.ex[j] = Util.shrink($(exlist[j]).children().remove("span").end().text());
        }

        glossesobjs.push(new KrWordEntry.KrDefinition(glossobj.def, glossobj.ex));
    }

    if (glosses.length == 0) {
        glosses = $("#meanArea > .pclass");

        let glossobj = {
            def: glosses.text().trim().replace(WHITESPACE, " "),
            ex: []
        };

        let exlist = $("#meanArea > ul.lst_mean > li");
        for (let j = 0; j <= exlist.length - 1; j++) {
            glossobj.ex[j] = Util.shrink($(exlist[j]).text());
        }

        glossesobjs.push(new KrWordEntry.KrDefinition(glossobj.def, glossobj.ex));
    }

    let resultobj = {};

    resultobj.word = word;
    if (hanja) resultobj.hanja = hanja;
    if (wordclass) resultobj.wclass = wordclass;
    if (pronun) resultobj.pronun = pronun;

    resultobj.defs = glossesobjs;

    return resultobj;

}

function lookUp(link) {
    let http = require('http');

    REQUEST_OPTIONS.path = "/" + link;

    return Util.queryNaver(REQUEST_OPTIONS)
        .then((html) => {
            let resultObj = parseDetails(html);
            resultObj.more = link;
            resultObj.partial = false;
            return new KrWordEntry(
                resultObj.word,
                resultObj.hanja,
                resultObj.pronun,
                resultObj.wclass,
                resultObj.defs,
                false,
                link
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
            res.status(400).end();
        });
}

module.exports.serve = serve;
