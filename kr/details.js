const REQUEST_OPTIONS = {
    host: "krdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET',
    agent: false
};

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const MARK_PRONUN = "발음";

function parseDetails(html, resolve) {
    let $ = require('cheerio').load(html);

    let titleArea = $(".spot_area#wordArea h3");

    let hanja = titleArea.find(".hanja").text().trim().replace(WHITESPACE, " ");
    let pronun = titleArea.children("em:contains('" + MARK_PRONUN + "')").text().replace(WHITESPACE, " ").trim();
    pronun = pronun.substring(pronun.indexOf(": ") + 2, pronun.length - 1);

    let word = titleArea.children().remove().end().text().trim().replace(WHITESPACE, " ");

    let wordclass = $("#meanArea h4").text().trim().replace(WHITESPACE, " ");

    let glosses = $("dl.lst > dt");
    let examplelists = $("dl.lst > dd");

    let glossesobjs = [];

    for (let i = 0; i <= glosses.length - 1; i++) {
        let glossobj = {};
        glossobj.def = $(glosses[i]).find(".title").children("strong").text().replace(WHITESPACE, " ");
        glossobj.ex = [];
        let exlist = $(examplelists[i]).find(".lst_mean > li");
        for (let j = 0; j <= exlist.length - 1; j++) {
            glossobj.ex[j] = $(exlist[j]).children().remove("span").end().text().trim().replace(WHITESPACE, " ");
        }

        glossesobjs.push(glossobj);
    }

    if (glosses.length == 0) {
        glosses = $("#meanArea > .pclass");

        let glossobj = {
            def: glosses.text().trim().replace(WHITESPACE, " "),
            ex: []
        };

        let exlist = $("#meanArea > ul.lst_mean > li");
        for (let j = 0; j <= exlist.length - 1; j++) {
            glossobj.ex[j] = $(exlist[j]).text().trim().replace(WHITESPACE, " ");
        }

        glossesobjs.push(glossobj)
    }

    let resultobj = {};

    let wordinfo = {};

    wordinfo.word = word;
    if (hanja) wordinfo.hanja = hanja;
    if (wordclass) wordinfo.wclass = wordclass;
    if (pronun) wordinfo.pronun = pronun;

    resultobj.wordinfo = wordinfo;
    resultobj.defs = glossesobjs;

    resolve(resultobj);

}

function lookUp(link) {
    return new Promise((resolve, reject) => {

        let http = require('http');

        REQUEST_OPTIONS.path = "/" + link;

        let req = http.request(REQUEST_OPTIONS, function(res) {
            res.setEncoding('utf8');
            let html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    parseDetails(html, resolve);
                });
        });
        req.end();
    })
}
const heapdump = require('heapdump');

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

module.exports.route = serve;
