/*

An example response looks like this:

ji: "生",
kun: [
    "いきる",
    ”生える”
],
on: [
    ”せい”
    ”しょう”
],
kr: [
    "날",
    "생"
]
str: 5,
rad: "生",
mean: [
    m: "독서·학습하는 사람.",
    ex: [
        {
        jp: "(先生;せんせい)",
        kr: "선생"
    }
    ]
],
kunex: [
    {
    word: "(学生;がくせい)",
    lnk: "entry/jk/JK000000014265.nhn"
}
]
*/

const REQUEST_OPTIONS = {
    host: "jpdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET'
};

const MARK_ONYOMI = "음독";
const MARK_KUNYOMI = "훈독";
const MARK_STROKES = "총획";
const MARK_RADICAL = "부수";

const DELIM_YOMI = "·";

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

function parseMoreInfo(link) {
    let str = link;
    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(1);
    return str;
}

function parseDetails(html, resolve) {
    let $ = require('cheerio').load(html);
    let deflate = require('./util.js').deflateStr;
    let parseRuby = require('./util.js').parseRuby;

    let detailsobj = {};


    let container = $("div.detail_hj#content");
    detailsobj.ji = $(container).find(".hanja h3").text();

    let strokes = deflate($(container).find("dt:contains('" + MARK_STROKES + "')").next("dd").text());
    detailsobj.str = parseInt(strokes.substring(0, strokes.length - 1));

    let radicalRow = deflate($(container).find("dt:contains('" + MARK_RADICAL + "')").next("dd").text());
    detailsobj.rad = radicalRow.substring(0, 1);

    let kr_readings = radicalRow.substring(radicalRow.indexOf(')') + 1).split(" ");
    detailsobj.kr = kr_readings.slice(0, kr_readings.length - 1);

    let meaningContainers = $(container).find("#meaningDiv .section ol li");
    let meanings = [];
    for (let i = 0; i <= meaningContainers.length - 1; i++) {
        let mean = $(meaningContainers[i]).find(".lst_txt").text();
        mean = deflate(mean);

        let ex = [];
        let exContainers = $(meaningContainers[i]).children("p");
        for (let j = 0; j <= exContainers.length - 1; j++) {
            let exCont = $(exContainers[j]).children("span").remove(".player, .ico_bl").end();
            let exstrkr = deflate($($(exCont).children()[1]).text());
            let exstrjp = parseRuby($($(exCont).children()[0]), $);

            let exobj = {
                jp: exstrjp,
                kr: exstrkr
            };

            ex.push(exobj);
        }

        let meanobj = {
            m: mean,
            ex: ex
        };

        meanings.push(meanobj);
    }
    detailsobj.mean = meanings;

    let kunyomi = [];
    let kunex = [];

    let kunyomiContainer = $(container).find("dt:contains('" + MARK_KUNYOMI + "')").next("dd");
    if (kunyomiContainer.length > 0) {
        kunyomi = deflate(kunyomiContainer.text()).split(DELIM_YOMI);
        for (let i = 0; i <= kunyomi.length - 1; i++) {
            kunyomi[i] = kunyomi[i].trim();
        }
        detailsobj.kun = kunyomi;
        let kunexContainers = $(container).find("#meanReadDiv .section h6");
        if (kunexContainers.length > 0) {
            for (let i = 0; i <= kunexContainers.length - 1; i++) {
                let ex = $(kunexContainers[i]).text();
                let more = parseMoreInfo($(kunexContainers[i]).find("a").attr("href"));
                let kunexobj = {
                    word: ex,
                    lnk: more
                };
                kunex.push(kunexobj);
            }
            detailsobj.kunex = kunex;
        }
    }

    let onyomi = [];
    let onex = [];

    let onyomiContainer = $(container).find("dt:contains('" + MARK_ONYOMI + "')").next("dd");
    if (onyomiContainer.length > 0) {
        onyomi = deflate(onyomiContainer.text()).split(DELIM_YOMI);
        for (let i = 0; i <= onyomi.length - 1; i++) {
            onyomi[i] = onyomi[i].trim();
        }
        detailsobj.on = onyomi;
        let onexContainers = $(container).find("#soundReadDiv .section h6");
        if (onexContainers.length > 0) {
            for (let i = 0; i <= onexContainers.length - 1; i++) {
                let ex = $(onexContainers[i]).text();

                let kana  = ex.substring(0, ex.indexOf('[')).trim();
                let kanji = ex.substring(ex.indexOf('[')+1, ex.indexOf(']'));

                ex = "(" + kanji + ";" + kana + ")";

                let more = parseMoreInfo($(onexContainers[i]).find("a").attr("href"));
                let onexobj = {
                    word: ex,
                    lnk: more
                };
                onex.push(onexobj);
            }
            detailsobj.onex = onex;
        }
    }

    resolve(detailsobj);

}

function serve(link, page, pagesize) {
    return new Promise((resolve, reject) => {

        let http = require('http');

        REQUEST_OPTIONS.path = "/" + link;

        let req = http.request(REQUEST_OPTIONS, function(res) {
            res.setEncoding('utf8');
            var html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    parseDetails(html, resolve);
                });
        });
        req.end();
    });
}

module.exports = serve;
