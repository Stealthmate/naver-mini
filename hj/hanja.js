const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search/keyword?query=" + QUERY + "&page=" + PAGE;

const REQUEST_OPTIONS = {
    host: "hanja.naver.com",
    port: 80,
    path: URL_TEMPLATE,
    method: 'GET'
};

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

function parseDefinitionHeader(header, $) {
    let headerobj = {};
    let name = header.find(".fnt15").children("sup").remove().end().text();
    headerobj.word = name.replace(/\(.*\)/, "").trim();
    headerobj.hanja = name.substring(name.indexOf('(') + 1, name.indexOf(')')).trim();
    headerobj.pronun = header.find(".pronun").text();
    return headerobj;
}

function parseMoreInfo(link) {
    let str = link;
    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(str.indexOf("/openkr"));
    return str;
}

function parseHanja(sec, $) {
    let hjlist = [];

    let hanjas = sec.children("dt");
    let hanjadefs = sec.children("dd");  

    for (let i = 0; i <= hanjas.length - 1; i++) {

        let hanja = $(hanjas[i]).text().replace(WHITESPACE, " ");
	let hjdef = $(hanjadefs[i]);

	let namelink = hjdef.children("a").eq(0).text().replace(WHITESPACE, " ");
	let meaning = hjdef.children(".meaning").text().replace(WHITESPACE, " ");
	let radical = hjdef.children(".sub_info").find("li").eq(0).find("span").text().replace(WHITESPACE, " ");
	let strokes = hjdef.children(".sub_info").find("li").eq(1).children().remove().end().text().replace(WHITESPACE, " ");
	strokes = parseInt(strokes.substring(0, strokes.length-1));
	let difficulty = hjdef.children(".sub_info").find("li").eq(2).children().remove().end().text().replace(WHITESPACE, " ");
	hjlist.push({
		hanja: hanja,
		meaning: meaning,
		name: namelink,
		radical: radical,
		strokes: strokes,
		difficulty: difficulty
	});
    }

    return hjlist;
}

function parseResult(html) {
    let $ = require('cheerio').load(html);

    let sections = $("#content > div.result_chn_chr");

    let hanja = parseHanja(sections.find("dl"), $);

    let resultobj = hanja;

    return resultobj;
}

function lookUp(query, page) {
    return new Promise((resolve, reject) => {
        let http = require('http');

        if (page < 1) page = 1;

        REQUEST_OPTIONS.path = URL_TEMPLATE.replace(PAGE, page).replace(QUERY, encodeURIComponent(query));
        let reqtime = Date.now();
        let req = http.request(REQUEST_OPTIONS, function(res) {
            res.setEncoding('utf8');
            var html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    let restime = (Date.now() - reqtime)/1000;
                    if(restime > 1) console.log("Response from naver " + restime);
                    resolve(parseResult(html));
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
