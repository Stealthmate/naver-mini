const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?range=word&q=%QUERY%&page=%PAGE%";

const REQUEST_OPTIONS = {
    host: "jpdic.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const MARK_ONYOMI = "음독";
const MARK_KUNYOMI = "훈독";
const MARK_STROKES = "총획";
const MARK_RADICAL = "부수";

const TYPE_DEFINITION = 0;
const TYPE_KANJI = 1;

const MOREINFO_WIKTIONARY = "wiktionary";

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    headerobj.word = header.find("a").text().trim();
    headerobj.kanji = header.find("span.sw > span.jp").text().trim();
    return headerobj;
}

function parseMoreInfo(link) {
    let str = link;

    if (link.indexOf(MOREINFO_WIKTIONARY) >= 0) {
        return link;
    }

    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(1);
    return str;
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
    let kanji = header.find("span.sw > span.jp").text().trim();

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

    if (wordclass != "") wordClasses = wordclass.join().replace(WHITESPACE, " ").replace(/[\[\]]/g, "").split(", ");
    else wordClasses = [];

    let glosses = $(def.find("li span"));

    let gloss = $(glosses[0]);
    let more = undefined;

    if (glosses.length < 1) {
        gloss = definition;

    } else {
        more = parseMoreInfo($(def.find("a.mw")).attr("href"));
    }

    let replaceWordClassInDefinition = new RegExp("\\[(" + wordClasses.join("|") + ")\\]", "g");
    gloss = parseRuby(gloss, $).replace(replaceWordClassInDefinition, "").replace(/\[\]/g, "").replace(WHITESPACE, " ").trim();

    if (gloss.indexOf("...") > -1) {
        more = parseMoreInfo($(def.find("a.mw")).attr("href"));
    }

    let definitionObj = {
        word: word,
        meanings: [{
            m: gloss,
            ex: []
        }]
    };

    if (kanji != "") definitionObj.kanji = kanji;
    if (wordClasses.length > 0) definitionObj.wclass = wordClasses.join(";");
    if (more) definitionObj.more = more;

    return {
        type: TYPE_DEFINITION,
        obj: definitionObj
    };
}

function parseKanji(container, $) {

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

    let more = parseMoreInfo($(container).find(".type_hj a").attr("href"));

    let kanji = {
        ji: ji,
        str: strokes,
        rad: radical,
        mean: meaning,
        more: more
    }

    if (onyomi.length > 0) kanji.on = onyomi;
    if (kunyomi.length > 0) kanji.kun = kunyomi;

    return {
        type: TYPE_KANJI,
        obj: kanji
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

function parseResult(html, resolve) {
    let $ = require('cheerio').load(html);

    let sections = $(".section, .section4");

    let definitions = parseDefinitions(sections.find(".srch_box"), $);

    let resultobj = definitions;

    resolve(resultobj);
}

function lookUp(query, page) {
    return new Promise((resolve, reject) => {
        let http = require('http');

        if (page < 1) page = 1;

        REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));

        let req = http.request(REQUEST_OPTIONS, function(res) {
            res.setEncoding('utf8');
            var html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    parseResult(html, resolve);
                });
        });
        req.end();
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
        });
}

module.exports.route = serve;
