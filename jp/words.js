const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?range=word&q=%QUERY%&page=%PAGE%";

const REQUEST_OPTIONS = {
    host: "jpdic.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const MARK_ONYOMI = "음독";
const MARK_KUNYOMI = "훈독";
const MARK_STROKES = "총획";
const MARK_RADICAL = "부수";

const TYPE_DEFINITION = 0;
const TYPE_KANJI = 1;

const Util = require("../util.js");

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    headerobj.word = Util.shrink(header.find("a").text());
    headerobj.kanji = Util.shrink(header.find("span.sw > span.jp").text());
    return headerobj;
}

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

function parseDefinition(def, $) {

    let header = $(def).find("p.entry");
    let word = header.find("a").text().trim();
    let kanji = Util.shrink(header.find("span.subtitle, span.sw > span.jp").text().replace(/[\(\)]/g, ""));

    let firstRow = $(def.find("span.pin"));

    let definition = "";
    let wordClasses = "";

    if ($(firstRow).children().length > 0) {
        definition = $(firstRow).children();
        wordClasses = $(firstRow).children().remove().end().text();
    } else {
        wordClasses = $(firstRow).text();
    }

    let wordclass = wordClasses.match(WORDCLASS) || "";

    if (wordclass != "") wordClasses = Util.shrink(wordclass.join()).replace(/[\[\]]/g, "").split(", ");
    else wordClasses = [];

    let glosses = $(def.find("li span"));

    let gloss = $(glosses[0]);
    let more = undefined;
    let partial = true;

    if (glosses.length < 1) {
        gloss = definition;
        partial = false;
    }
    more = Util.extractLink($(def.find("a.mw")).attr("href"));

    let replaceWordClassInDefinition = new RegExp("\\[(" + wordClasses.join("|") + ")\\]", "g");
    gloss = parseRuby(gloss, $).replace(replaceWordClassInDefinition, "").replace(/\[\]/g, "");

    gloss = Util.shrink(gloss);
    more = Util.extractLink($(def.find("a.mw")).attr("href"));

    let JpWordEntry = require("../models/JpWordEntry.js");

    let glossObj = new JpWordEntry.JpGloss(gloss, null);
    let meaning = new JpWordEntry.JpMeaning(null, [glossObj]);
    let clsgrp = new JpWordEntry.JpWordClassGroup(wordClasses.join(";"), [meaning]);
    let definitionObj = new JpWordEntry(word, kanji, [clsgrp], partial, more);

    return {
        type: TYPE_DEFINITION,
        obj: definitionObj.getCompressed()
    };
}

function parseKanji(container, $) {

    let JpKanjiEntry = require("../models/JpKanjiEntry.js");

    let ji = $(container).find(".type_hj").text();

    let onyomiContainer = $(container).find("dt:contains('" + MARK_ONYOMI + "')").next("dd").children("span.jp");
    let onyomi = [];

    for (let i = 0; i <= onyomiContainer.length - 1; i++) {
        onyomi.push($(onyomiContainer[i]).text());
    }

    let kunyomiContainer = $(container).find("dt:contains('" + MARK_KUNYOMI + "')").next("dd").children("span.jp");
    let kunyomi = [];

    for (let i = 0; i <= kunyomiContainer.length - 1; i++) {
        kunyomi.push($(kunyomiContainer[i]).text());
    }

    let strokes = $(container).find("dt:contains('" + MARK_STROKES + "')").next("dd").text();
    strokes = parseInt(strokes.substring(0, strokes.length - 1));

    let lastRow = $(container).find("dt:contains('" + MARK_RADICAL + "')").next("dd").text();
    radical = lastRow.substring(0, lastRow.indexOf('('));
    let meaning = lastRow.substring(lastRow.indexOf('|') + 1).split(" ");

    let meanArr = [];
    for (let i = 0; i <= meaning.length - 1; i++) {
        meanArr.push(new JpKanjiEntry.JpKanjiMeaning(meaning[i], null));
    }

    let more = Util.extractLink($(container).find(".type_hj a").attr("href"));

    let kanjiObj = new JpKanjiEntry(ji, strokes, radical, meanArr, null, onyomi, null, kunyomi, null, true, more);

    return {
        type: TYPE_KANJI,
        obj: kanjiObj.getCompressed()
    };
}

function parseDefinitions(items, $) {
    let deflist = [];

    let definitions = items;

    for (let i = 0; i <= definitions.length - 1; i++) {

        let def = $(definitions[i]);

        if (def.find(".entry.type_hj").length > 0) {
            deflist[i] = parseKanji(def, $);
        } else deflist[i] = parseDefinition(def, $);
    }

    return deflist;
}

function parseResult(html) {
    let $ = require('cheerio').load(html);

    let sections = $(".section, .section4");

    return parseDefinitions(sections.find(".srch_box"), $);
}

function lookUp(query, page) {
    if (page < 1) page = 1;

    REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));

    return Util.queryNaver(REQUEST_OPTIONS)
        .then((html) => {
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
            res.status(500).end();
        });
}

module.exports.serve = serve;
