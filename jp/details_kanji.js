const JpKanjiEntry = require("../models/JpKanjiEntry.js");

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

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const Util = require("../util.js");

function parseDetails(html) {
    let $ = require('cheerio').load(html);

    let deflate = Util.shrink;
    let parseRuby = require('./jputil.js').parseRuby;

    let container = $("div.detail_hj#content");
    let kanji = $(container).find(".hanja h3").text();

    let strokes = deflate($(container).find("dt:contains('" + MARK_STROKES + "')").next("dd").text());
    strokes = parseInt(strokes.substring(0, strokes.length - 1));

    let radicalRow = deflate($(container).find("dt:contains('" + MARK_RADICAL + "')").next("dd").text());
    let radical = radicalRow.substring(0, 1);

    let kr_readings = radicalRow.substring(radicalRow.indexOf(')') + 1).split(" ");
    kr_readings = kr_readings.slice(0, kr_readings.length - 1);

    let meaningContainers = $(container).find("#meaningDiv .section").children("ul, ol").children("li");

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

            ex.push(new JpKanjiEntry.TranslatedExample(
                JpKanjiEntry.TranslatedExample.LANGS.JP, JpKanjiEntry.TranslatedExample.LANGS.KR, null, exstrjp, exstrkr));
        }

        meanings.push(new JpKanjiEntry.JpKanjiMeaning(mean, ex));
    }
    let kunyomi = [];
    let kunex = [];

    let kunyomiContainer = $(container).find("dt:contains('" + MARK_KUNYOMI + "')").next("dd");

    if (kunyomiContainer.length > 0) {
        kunyomi = deflate(kunyomiContainer.text()).split(DELIM_YOMI);
        for (let i = 0; i <= kunyomi.length - 1; i++) {
            kunyomi[i] = kunyomi[i].trim();
        }
        let kunexContainers = $(container).find("#meanReadDiv .section h6");
        if (kunexContainers.length > 0) {
            for (let i = 0; i <= kunexContainers.length - 1; i++) {
                let ex = $(kunexContainers[i]).text();
                let more = Util.extractLink($(kunexContainers[i]).find("a").attr("href"));
                kunex.push(new JpKanjiEntry.WordLink(ex, more));
            }
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
        let onexContainers = $(container).find("#soundReadDiv .section h6");
        if (onexContainers.length > 0) {
            for (let i = 0; i <= onexContainers.length - 1; i++) {
                let ex = $(onexContainers[i]).text();

                let kana = ex.substring(0, ex.indexOf('[')).trim();
                let kanji = ex.substring(ex.indexOf('[') + 1, ex.indexOf(']'));

                ex = "(" + kanji + ";" + kana + ")";

                let more = Util.extractLink($(onexContainers[i]).find("a").attr("href"));
                onex.push(new JpKanjiEntry.WordLink(ex, more));
            }
        }
    }

    let detailsObj = {
        kanji: kanji,
        strokes: strokes,
        radical: radical,
        meanings: meanings,
        kr: kr_readings,
        onyomi: onyomi,
        onex: onex,
        kunyomi: kunyomi,
        kunex: kunex
    };

    return detailsObj;

}

function serve(link, page, pagesize) {

    REQUEST_OPTIONS.path = "/" + link;

    return Util.queryNaver(REQUEST_OPTIONS)
        .then((html) => {
            let resultObj = parseDetails(html);
            resultObj.more = link;
            resultObj.partial = false;
            return new JpKanjiEntry(
                resultObj.kanji,
                resultObj.strokes,
                resultObj.radical,
                resultObj.meanings,
                resultObj.kr,
                resultObj.onyomi,
                resultObj.onex,
                resultObj.kunyomi,
                resultObj.kunex,
                false,
                link).getCompressed();
        });
}

module.exports = serve;
