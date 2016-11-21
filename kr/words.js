const KrWordEntry = require("../models/KrWordEntry.js");

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?kind=keyword&query=%QUERY%&page=%PAGE%";

const REQUEST_OPTIONS = {
    host: "krdic.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const MARK_OPENKR = "openkr";

const Util = require("../util.js");

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    let name = Util.shrink(header.find(".fnt15").children("sup").remove().end().text());
    headerobj.word = name.replace(/\(.*\)/, "").trim();
    headerobj.hanja = name.substring(name.indexOf('(') + 1, name.indexOf(')')).trim();
    headerobj.pronun = header.find(".pronun").text();
    return headerobj;
}

function parseDefinitions(sec, $) {
    let deflist = [];

    let definitions = sec.children("li");

    for (let i = 0; i <= definitions.length - 1; i++) {

        let def = $(definitions[i]);

        let header = parseDefinitionHeader($(def.find("div")), $);
        let wordclassstr = Util.shrink($(def.find("p").not(".syn")).text()).replace(" ", "\n");

        let wordclass = wordclassstr.match(WORDCLASS) || "";

        if (wordclass != "") wordclass = Util.shrink(wordclass.join()).replace(/[\[\]]/g, "").split(", ");
        else wordclass = [];

        let toReplace = new RegExp("\\[(" + wordclass.join("|") + ")\\]", "g");

        let glosses = $(def.children().find("li span.con"));

        let gloss = "";
        let more = undefined;
        let partial = false;

        if (glosses.length < 1) {
            glosses = $(def.find("p"));
        } else {
            partial = true;
        }

        gloss = Util.shrink($(glosses[0]).text()).replace(toReplace, "").replace(/\[\]/g, "");

        if (gloss.indexOf("...") > -1) {
            partial = true;
        }
        more = Util.extractLink($(def.find(".fnt15")).attr("href"));

        let definitionObj = new KrWordEntry.KrDefinition(gloss, null);

        let defobj = {
            word: header.word,
            defs: [definitionObj]
        }

        let isOpenKR = false;

        if (header.hanja) defobj.hanja = header.hanja;
        if (header.pronun) defobj.pronun = header.pronun;
        if (wordclass.length > 0) defobj.wclass = wordclass.join(";");
        defobj.more = more;
        defobj.partial = partial;

        if ($(def.find(".fnt15")).attr("href").indexOf(MARK_OPENKR) >= 0) isOpenKR = true;

        if (!isOpenKR) deflist.push(
            new KrWordEntry(
                header.word,
                header.hanja,
                header.pronun,
                wordclass.join(";"),
                [definitionObj],
                partial,
                more).getCompressed());
    }

    return deflist;
}

function parseResult(html) {
    let $ = require('cheerio').load(html);

    let sections = $(".section, .section4");

    return parseDefinitions(sections.find(".head_word").parent().parent().children(".lst3"), $);
}

function lookUp(query, page) {
    let http = require('http');

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

module.exports.serve = serve;
