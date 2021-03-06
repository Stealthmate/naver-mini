const jsdom = require("jsdom").jsdom;

const URL_TEMPLATE = "/search.nhn?kind=keyword&query=";

const REQUEST_OPTIONS = {
    host: "krdic.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WHITESPACE = /[ \n\t]+/g;


function parseDefinitionHeader(header, $) {
    let headerobj = {};
    let name = header.find(".fnt15").children("sup").remove().end().text();
    headerobj.word = name.replace(/\(.*\)/, "").trim();
    headerobj.hanja = name.substring(name.indexOf('(')+1, name.indexOf(')')).trim();
    headerobj.pronun = header.find(".pronun").text();
    return headerobj;
}

function parseDefinitions(sec, $) {
    let deflist = [];

    let definitions = sec.children("li");

    for (let i = 0; i <= definitions.length - 1; i++) {

        let def = $(definitions[i]);

        var header = parseDefinitionHeader($(def.find("div")), $);
        var wordclassstr = $(def.find("p").not(".syn")).text().replace(WHITESPACE, " ");
        let wordclass = wordclassstr.match(/^\[[^\[\]]+\]/g) || "";
        console.log(wordclass)
        if(wordclass != "") wordclass = wordclass.join();
        var glosses = $(def.find("li span"));
        if(glosses.length < 1) glosses = $(def.find("p"))


        var glossesobj = [];
        for (let i = 0; i <= glosses.length - 1; i++) {
            glossesobj[i] = $(glosses[i]).text().replace(WHITESPACE, " ").replace(wordclass, "");
        }
        deflist[i] = {
            head: header,
            class: wordclass,
            gloss: glossesobj
        }
    }

    return deflist;
}

function parseIdioms(sec, $) {
    let idiomlist = [];

    let idioms = sec.children("li");

    for (let i = 0; i <= idioms.length - 1; i++) {

        let idiom = $(idioms[i]);

        let wordclass = idiom.find(".cate").text();

        let text = idiom.children("div").children("a").text();
        let desc = idiom.find("p").text();

        idiomlist[i] = {
            class: wordclass,
            txt: text,
            desc: desc
        };
    }

    return idiomlist;

}

function parseResult(html, resolve) {
    let wnd = jsdom(html).defaultView;
    let $ = require('jquery')(wnd);

    let sections = $(".section, .section4");

    let definitions = parseDefinitions(sections.find(".head_word").parent().parent().children(".lst3"), $);
    let idioms = parseIdioms(sections.find(".head_adage").parent().parent().children(".lst3"), $);

    let resultobj = {
        defs: definitions,
        idioms: idioms
    };

    resolve(resultobj);
}

function lookUp(word) {
    return new Promise((resolve, reject) => {
        let http = require('http');

        REQUEST_OPTIONS.path = URL_TEMPLATE + encodeURIComponent(word);

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
    var query = req.query.q;
    lookUp(query)
        .then(result => {
            res.send(result);
        });
}

module.exports.route = require('./words.js').route;
