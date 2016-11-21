const REQUEST_OPTIONS = {
    host: "jpdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET'
};

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const Util = require("../util.js");

function parseRuby(el, $) {

    let str = el.find("rp").remove().end().text();
    let rbkanji = el.find("rb");
    let rbfuri = el.find("rt");

    for (let i = 0; i <= rbkanji.length - 1; i++) {
        let kanji = $(rbkanji[i]).text();
        let furigana = $(rbfuri[i]).text();
        if (kanji.length > 0 && furigana.length > 0) str = str.replace(kanji + furigana, "(" + kanji + ";" + furigana + ")");
    }
    return str;
}

function parseExamples(keyword, container, $) {
    let exampleContainers = $(container).children("p");

    let examples = [];

    for (let l = 0; l <= exampleContainers.length - 1; l++) {

        let exampleContainer = $(exampleContainers[l]).children("span").remove(".player, .ico_bl").end().children("span");
        let original = parseRuby($(exampleContainer[0]), $);
        let translation = parseRuby($(exampleContainer[1]), $);

        let TranslatedExample = require("../models/TranslatedExample.js");
        let from, to;
        if($(exampleContainer[0]).attr("lang") === "jp") {
            from = TranslatedExample.LANGS.JP;
            to = TranslatedExample.LANGS.KR;
        } else {
            from = TranslatedExample.LANGS.KR;
            to = TranslatedExample.LANGS.JP;
        }
        examples.push(new TranslatedExample(from, to, keyword, original, translation));
    }

    return examples;
}

function parseDetails(html) {
    let $ = require('cheerio').load(html);

    let JpWordEntry = require("../models/JpWordEntry.js");

    let classSections = $(".section_article");

    let word = $(".spot_area .maintitle").text();
    let kanji = $(".spot_area .ps").text();
    kanji = kanji.substring(1, kanji.length - 1);

    let wordclasses = [];

    for (let i = 0; i <= classSections.length - 1; i++) {
        let wordclass = $(classSections[i]).find("h5").text().trim();
        //console.log(" - " + wordclass);
        let meanings = [];
        let meaningContainers = $(classSections[i]).find(".mean_level_2 > li, .mean_level_1 > li");
        for (let j = 0; j <= meaningContainers.length - 1; j++) {

            let meaning = parseRuby($(meaningContainers[j]).children(".lst_txt"), $);

            let glosses = [];
            let glossContainers = $(meaningContainers[j]).find(".mean_level_3 > li");

            for (let k = 0; k <= glossContainers.length - 1; k++) {
                let gloss = parseRuby($(glossContainers[k]).children(".lst_txt"), $);
                //console.log(" - - - " + gloss);

                let examples = parseExamples(word, glossContainers[k], $);
                glosses.push(new JpWordEntry.JpGloss(gloss, examples));
            }

            let examples = parseExamples(word, meaningContainers[j], $);
            let meaningObj = new JpWordEntry.JpMeaning(null, [new JpWordEntry.JpGloss(meaning, examples)]);
            if (glosses.length > 0) {
                meaningObj = new JpWordEntry.JpMeaning(meaning, glosses);
            }
            meanings.push(meaningObj);
        }

        wordclasses.push(new JpWordEntry.JpWordClassGroup(wordclass, meanings));
    }

    let result = {};
    result.word = word;
    result.kanji = kanji;
    result.clsgrps = wordclasses;
    return result;

}

function serve(link, page, pagesize) {
    REQUEST_OPTIONS.path = "/" + link;

    return Util.queryNaver(REQUEST_OPTIONS)
        .then((html) => {
            let resultObj = parseDetails(html);
            resultObj.partial = false;
            resultObj.more = link;
            let JpWordEntry = require("../models/JpWordEntry.js");
            let result = new JpWordEntry(resultObj.word, resultObj.kanji, resultObj.clsgrps, false, link);
            return result.getCompressed();
        });
}

module.exports = serve;
