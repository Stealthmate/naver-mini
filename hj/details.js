const REQUEST_OPTIONS = {
    host: "hanja.naver.com",
    port: 80,
    path: "/",
    method: 'GET'
};
const QUERY = "%QUERY%";
const URL_TEMPLATE = "/hanja?q=" + QUERY;

const MARK_ONYOMI = "음독";
const MARK_KUNYOMI = "훈독";
const MARK_STROKES = "층획";
const MARK_RADICAL = "부수";

const DELIM_YOMI = "·";

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const MARK_HIERO_EXPL = "상형문자";
const MARK_RELATED_HANJA = "관련 한자";

const MARK_REL_HANJA_SHAPE = "이형동의자(이체자)";
const MARK_REL_HANJA_MEAN = "같은 뜻을 가진 한자(유의자)";
const MARK_REL_HANJA_OPP = "반대 뜻을 가진 한자(상대자)";
const MARK_REL_WORDS = "관련 단어";
const MARK_REL_IDIOMS = "관련 고사성어";

function parseMoreInfo(link) {
    let str = link;
    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(1);
    return str;
}

function parseDetails(html) {
    let $ = require('cheerio').load(html);

    let content = $("#content");

    let top = content.find(".entrytop_box > dl");

    if (top.length === 0) return {};

    let hanja = top.find("dt").text();

    let misc = top.find("dd").children().remove("a").end();

    let readings = misc.children("strong").text().replace(WHITESPACE, " ").split(" ");

    let miscinfo = misc.find("ul > li");
    let radical = miscinfo.eq(0).find("span.hanja").text();
    let strokes = miscinfo.eq(1).find("span.num").text();
    let saseongeum = miscinfo.eq(2).find("span.sound").text().split(", ");
    let difficulty = miscinfo.eq(3).children().remove("em").end().text().replace(WHITESPACE, " ");

    let meaningsDOM = content.find(".kinds_list > ul").eq(0).children("li");
    let meanings = [];
    for (let i = 0; i <= meaningsDOM.length - 1; i++) {
        let text = meaningsDOM.eq(i).text();
        text = text.substring(text.indexOf(".") + 2).replace(WHITESPACE, " ").trim();
        meanings.push(text);
    }

    let explanationsDOM = content.find(".kinds_list > ul.lines > li");
    let explanations = [];
    for (let i = 0; i <= explanationsDOM.length - 1; i++) {
        let text = explanationsDOM.eq(i).text().replace(WHITESPACE, " ").trim();
        explanations.push(text);
    }



    let hieroExpl = undefined;
    let relHanja = {};

    let subsects = content.find(".word_txt");

    for (let i = 0; i <= subsects.length - 1; i++) {
        let heading = subsects.eq(i).find("h5").text().replace(WHITESPACE, " ").trim();
        if (heading === MARK_HIERO_EXPL) {
            hieroExpl = subsects.eq(i).children("p").text().replace(WHITESPACE, " ").trim();
        } else if (heading == MARK_RELATED_HANJA) {
            let listnames = subsects.eq(i).find("p.blue");
            let lists = subsects.eq(i).find("ul");

            for (let j = 0; j <= lists.length - 1; j++) {
                let lnm = listnames.eq(j).text();
                let hanjalist = lists.eq(j).find("li a em").text().split("");
                if (lnm === MARK_REL_HANJA_SHAPE) {
                    relHanja.relShape = hanjalist;
                } else if (lnm === MARK_REL_HANJA_MEAN) {
                    relHanja.relMean = hanjalist;
                } else if (lnm === MARK_REL_HANJA_OPP) {
                    relHanja.oppMean = hanjalist;
                }
            }
        }
    }

    let strokepiclistDOM = content.find("#word_write > ul > li > img");
    let strokepiclist = [];
    for (let i = 0; i <= strokepiclistDOM.length - 1; i++) {
        let lnk = strokepiclistDOM.eq(i).attr("src");
        //lnk = lnk.substring(lnk.indexOf("/ga/") + 4);
        strokepiclist.push(lnk);
    }


    let relWords = [];
    let relIdioms = [];

    let relwordDOM = content.find(".word_list");
    for (let i = 0; i <= relwordDOM.length - 1; i++) {
        let heading = relwordDOM.eq(i).find("h5").text().replace(WHITESPACE, " ").trim();
        if (heading.indexOf(MARK_REL_WORDS) > -1) {
            let defs = relwordDOM.eq(i).find("dl > dt");
            for (let j = 0; j <= defs.length - 1; j++) {
                let hj = defs.eq(i).text().trim();
                let hg = defs.eq(i).nextUntil("dt").eq(0).text().trim();
                relWords.push({
                    hj: hj,
                    hg: hg
                });
            }
        } else if (heading.indexOf(MARK_REL_IDIOMS) > -1) {
            let defs = relwordDOM.eq(i).find("dl > dt");
            for (let j = 0; j <= defs.length - 1; j++) {
                let hj = defs.eq(i).text().trim();
                let hg = defs.eq(i).nextUntil("dt").eq(0).text().trim();
                relIdioms.push({
                    hj: hj,
                    hg: hg
                });
            }
        }
    }


    let detailsObj = {
        hanja: hanja,
        readings: readings,
        radical: radical,
        strokes: strokes,
        saseongeum: saseongeum,
        diff: difficulty,
        mean: meanings,
        expl: explanations,
        relHanja: relHanja,
        strokeDiagram: strokepiclist,
        relWords: relWords,
        relIdioms: relIdioms
    };
    if (hieroExpl) detailsObj.hieroexpl = hieroExpl;

    return detailsObj;

}

function lookUp(query) {
    return new Promise((resolve, reject) => {
        let http = require('http');

        REQUEST_OPTIONS.path = URL_TEMPLATE.replace(QUERY, encodeURIComponent(query));
        let req = http.request(REQUEST_OPTIONS, function(res) {
            res.setEncoding('utf8');
            var html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    resolve(parseDetails(html));
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