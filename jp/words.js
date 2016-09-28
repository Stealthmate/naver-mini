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

const jsdom = require("jsdom").jsdom;

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    headerobj.word = header.find("a").text().trim();
    headerobj.kanji = header.find("span.sw > span.jp").text().trim();
    return headerobj;
}

function parseMoreInfo(link) {
    let str = link;
    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(1);
    return str;
}

function parseGlossRuby(def, $) {

    let str = def.find("rp").remove().end().text();
    console.log(str);
    let rbkanji = def.find("rb");
    let rbfuri = def.find("rt");

    for(let i = 0; i <= rbkanji.length - 1; i++) {
        let kanji = $(rbkanji[i]).text();
        let furigana = $(rbfuri[i]).text();
        str = str.replace(kanji + furigana, "(" + kanji +  ";" + furigana + ")");
    }
    console.log(str);
    return str;
}

function parseDefinitions(items, $) {
    let deflist = [];

    let definitions = items;

    for (let i = 0; i <= definitions.length - 1; i++) {

        let def = $(definitions[i]);

        if(def.find(".entry.type_hj").length > 0) continue;

        let header = parseDefinitionHeader($(def).find("p.entry"), $);
        let wordclassstr = $(def.find("span.pin"));

        let definition = "";

        if($(wordclassstr).children().length > 0) {
            definition = $(wordclassstr).children();
            wordclassstr = $(wordclassstr).children().remove().end().text();
        } else {
            wordclassstr = $(wordclassstr).text();
        }

        let wordclass = wordclassstr.match(WORDCLASS) || "";

        if (wordclass != "") wordclass = wordclass.join().replace(WHITESPACE, " ").replace(/[\[\]]/g, "").split(", ");
        else wordclass = [];

        let toReplace = new RegExp("\\[(" + wordclass.join("|") + ")\\]", "g");

        let glosses = $(def.find("li span"));

        let gloss = $(glosses[i]);
        let more = undefined;

        if (glosses.length < 1) {
            gloss = definition;

        } else {
            more = parseMoreInfo($(def.find("a.mw")).attr("href"));
        }

        gloss = parseGlossRuby(gloss, $).replace(toReplace, "").replace(/\[\]/g, "").replace(WHITESPACE, " ").trim();

        if(gloss.indexOf("...") > -1) {
            more = parseMoreInfo($(def.find("a.mw")).attr("href"));
        }

        deflist[i] = {
            word: header.word,
            gloss: gloss
        };

        if (header.kanji) deflist[i].kanji = header.kanji;
        if (wordclass.length > 0) deflist[i].class = wordclass;
        if (more) deflist[i].more = more;
    }

    return deflist;
}

function parseResult(html, resolve) {
    let wnd = jsdom(html).defaultView;
    let $ = require('jquery')(wnd);

    let sections = $(".section, .section4");

    let definitions = parseDefinitions(sections.find(".srch_box"), $);

    let resultobj = {
        defs: definitions
    };

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
    if(page === undefined) page = 1;

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
