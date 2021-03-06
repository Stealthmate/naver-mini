const REQUEST_OPTIONS = {
    host: "endic.naver.com",
    port: 80,
    path: "/",
    method: 'GET'
};

const WHITESPACE = /[ \r\n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

function parseDefs(container, $) {

    let dts = container.children("dt");
    let defsArr = [];

    for (let j = 0; j <= dts.length - 1; j++) {

        let defobj = {};

        let def = $(dts[j]).children("span").eq(0).remove().end();
        let eng = def.find("i").eq(0).text().replace(WHITESPACE, " ").trim();
        let mean = def.children("em").find(".fnt_intro").remove().end().find(".blind").remove().end().text().replace(WHITESPACE, " ").trim();

        if (eng) defobj.enWord = eng;
        defobj.m = mean;

        let exarr = [];

        let examples = $(dts[j]).nextUntil("dt");
        for (let k = 0; k <= examples.length - 1; k++) {

            let exobj = {};

            let dd = $(examples[k]);
            let ex = dd.children("p").eq(0).text().replace(WHITESPACE, " ").trim();
            let translated = dd.children("p").eq(1).text().replace(WHITESPACE, " ").trim();

            exobj.ex = ex;
            exobj.tr = translated;

            exarr.push(exobj);
        }
        if (exarr.length > 0) defobj.ex = exarr;

        defsArr.push(defobj);
    }

    return defsArr;
}

function parseDetailsFromKr(html) {
    let $ = require('cheerio').load(html);

    let resultObj = {};

    let title = $("#content .word_view");
    let word = title.find(".tit strong").text().trim().replace(WHITESPACE, " ");
    resultObj.word = word;

    let hanja = title.find(".tit span").children().remove().end().text().replace(WHITESPACE, " ").trim();
    if (hanja) resultObj.extra = hanja;

    resultObj.clsgrps = [];
    resultObj.clsgrps.push({});
    resultObj.clsgrps[0].wclass = "";
    resultObj.clsgrps[0].meanings = parseDefs($("#zoom_content").children("div").children("dl.list_a11"), $);

    return resultObj;
}

function parseDetailsFromEnIdiom(html) {
    let $ = require('cheerio').load(html);

    let resultObj = {};

    return resultObj;
}

function parseDetailsFromEn(html) {
    let $ = require('cheerio').load(html);

    let resultObj = {};

    let title = $("#content .word_view");
    let word = title.find(".tit h3").text().trim().replace(WHITESPACE, " ");
    resultObj.word = word;

    let pronun = title.find(".pron em").children().eq(0).text().replace(WHITESPACE, " ").trim();
    if (pronun) resultObj.pronun = pronun;

    resultObj.clsgrps = [];

    let wclassSections = $("#zoom_content .box_wrap1").has("dl");

    for (let i = 0; i <= wclassSections.length - 1; i++) {
        let content = $(wclassSections[i]);

        let wclassDefArr = {};

        let wordclass = content.find("h3").text();
        wclassDefArr.wclass = wordclass;

        let dl = content.find("dl");

        wclassDefArr.meanings = parseDefs(dl, $);
        resultObj.clsgrps.push(wclassDefArr);
    }

    return resultObj;
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
                    let result = null;
                    if (link.indexOf("en") == 0) {
                        if(link.indexOf("Idiom") < 0) result = parseDetailsFromEn(html);
                        else result = parseDetailsFromEnIdiom(html);
                    }
                    else result = parseDetailsFromKr(html);

                    //hack for endic links
                    result.more = link.substring(0, link.indexOf("&sLn="));
                    result.partial = false;
                    resolve(result);
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
