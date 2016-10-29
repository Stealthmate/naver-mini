/*
word,
hanja,
pronun,
class,
meaning
*/



const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?sLn=en&query=" + QUERY + "&searchOption=entry_idiom";

const REQUEST_OPTIONS = {
    host: "endic.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WHITESPACE = /[ \r\n\t]+/g;

const WORDCLASS = /(^|\n)[\[\(][^\[\]]+[\]\)]/g;

const TYPE_DEFINITION = "d";
const TYPE_KANJI = "k";

const MOREINFO_WIKTIONARY = "wiktionary";

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    headerobj.word = header.find("a").text().trim();
    headerobj.kanji = header.find("span.sw > span.jp").text().trim();
    return headerobj;
}

function parseMoreInfo(link) {
    let str = link;

    if(link.indexOf(MOREINFO_WIKTIONARY) >= 0) {
        return link;
    }

    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(1);
    return str;
}

function parseDefinitions(items, $) {
    let deflist = [];

    let defs = items.find("dt");

    for (let i = 0; i <= defs.length - 1; i++) {

        let def = $(defs[i]);
        def = def.children("a").remove().end();
        //let word = $(def.children("span")[0]).find("sup").remove().end().text().trim().replace(WHITESPACE, " ");
        let word = def.children().eq(0).children().eq(0).find("sup").remove().end().text().trim().replace(WHITESPACE, " ");
        //let pronun = $(def.children("span")[1]).text().trim().replace(WHITESPACE, " ");
        let pronun = def.children("span").eq(1).text().trim().replace(WHITESPACE, " ");
        if(pronun.indexOf("[") < 0) pronun = "";
        pronun = pronun.replace(/[\[\]]/g, "");
        pronun = pronun.replace("|", "'");

        let hanja = null;
        if(!pronun) hanja = def.children().eq(0).children().remove().end().text().trim().replace(WHITESPACE, " ");

        let defd = $(def.nextUntil("dt").children("div").children("p")[0]);
        let meaning = ($(defd.children("span")[0]).text() + $(defd.children("span")[0]).nextUntil("img").text()).trim().replace(WHITESPACE, " ");
        if(meaning.length == 0) meaning = defd.text().trim().replace(WHITESPACE,  " ");

        let wordclasses = meaning.match(WORDCLASS);

        if(wordclasses != null) {
            for(let j=0;j<=wordclasses.length-1;j++) {
                meaning = meaning.replace(wordclasses[j], "");
                wordclasses[j] = wordclasses[j].replace(/[\[\]\(\)]/g, "");
            }
        }

        let resultItem = {};
        resultItem.word = word;
        if(pronun) resultItem.pronun = pronun;
        if(hanja) resultItem.hanja = hanja;
        if(wordclasses != null) resultItem.class = wordclasses;
        resultItem.meaning = meaning;

        deflist.push(resultItem);

    }

    return deflist;
}

function parseResult(html, resolve) {
    let $ = require('cheerio').load(html);


    let sections = $(".word_num_nobor > dl");

    let definitions = parseDefinitions(sections, $);

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
