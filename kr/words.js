const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?kind=keyword&query=%QUERY%&page=%PAGE%";

const REQUEST_OPTIONS = {
    host: "krdic.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const jsdom = require("jsdom").jsdom;

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    let name = header.find(".fnt15").children("sup").remove().end().text();
    headerobj.word = name.replace(/\(.*\)/, "").trim();
    headerobj.hanja = name.substring(name.indexOf('(') + 1, name.indexOf(')')).trim();
    headerobj.pronun = header.find(".pronun").text();
    return headerobj;
}

function parseMoreInfo(link) {
    //link = "http://cc.naver.com/cc?a=wrd.entry&r=1&i=18831401&bw=1131&px=145&py=355&sx=145&sy=355&m=1&ssc=dic.kr.keyword&q=%EB%BB%94%ED%95%98%EB%8B%A4&s=&p=&g=&u=http%3A%2F%2Fkrdic.naver.com%2Fdetail.nhn%3Fdocid%3D18831401";
    let str = link;
    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(1);
    return str;
}

function parseDefinitions(sec, $) {
    let deflist = [];

    let definitions = sec.children("li");

    for (let i = 0; i <= definitions.length - 1; i++) {

        let def = $(definitions[i]);

        let header = parseDefinitionHeader($(def.find("div")), $);
        let wordclassstr = $(def.find("p").not(".syn")).text().replace(WHITESPACE, " ").replace(" ", "\n");

        let wordclass = wordclassstr.match(WORDCLASS) || "";

        if (wordclass != "") wordclass = wordclass.join().replace(WHITESPACE, " ").replace(/[\[\]]/g, "").split(", ");
        else wordclass = [];

        let toReplace = new RegExp("\\[(" + wordclass.join("|") + ")\\]", "g");

        let glosses = $(def.find("li span"));

        let gloss = "";
        let more = undefined;

        if (glosses.length < 1) {
            glosses = $(def.find("p"));
        } else {
            more = parseMoreInfo($(def.find(".fnt15")).attr("href"));
        }

        gloss = $(glosses[0]).text().replace(toReplace, "").replace(/\[\]/g, "").replace(WHITESPACE, " ").trim();

        if(gloss.indexOf("...") > -1) {
            more = parseMoreInfo($(def.find(".fnt15")).attr("href"));
        }

        deflist[i] = {
            word: header.word,
            gloss: gloss
        };

        if (header.hanja) deflist[i].hanja = header.hanja;
        if (header.pronun) deflist[i].pronun = header.pronun;
        if (wordclass.length > 0) deflist[i].class = wordclass;
        if (more) deflist[i].more = more;
    }

    return deflist;
}

function parseResult(html, resolve) {
    let wnd = jsdom(html).defaultView;
    let $ = require('jquery')(wnd);

    let sections = $(".section, .section4");

    let definitions = parseDefinitions(sections.find(".head_word").parent().parent().children(".lst3"), $);

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
