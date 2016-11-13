const REQUEST_OPTIONS = {
    host: "endic.naver.com",
    port: 80,
    path: "/",
    method: 'GET',
    agent: false
};

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search_example.nhn?sLn=en&query=" + QUERY + "&pageNo=" + PAGE;

const WHITESPACE = /[ \n\t]+/g;

const WORDLINK = /\[([^\[\]]+)\]/g;

function parseResult(html, resolve) {
    let $ = require('cheerio').load(html);

    let examples = [];
    let exContainer = $("#exampleAjaxArea > ul > li");
    for (let i = 0; i <= exContainer.length - 1; i++) {
        let exItem = $(exContainer[i]);

        let keyword = exItem.children("div").eq(0).children("span").eq(1).find("b").eq(0).text().replace(WHITESPACE, " ");

        let original = exItem.children("div").eq(0).children("span").eq(1).text().replace(WHITESPACE, " ");
        let translated = $(exItem.children("div")[1]).text().replace(WHITESPACE, " ");

        let from = "EN";
        let to = "KR";

        examples.push({
            ex: original,
            tr: translated,
            keyword: keyword,
            from: from,
            to: to
        });
    }

    resolve(examples);
}

function lookUp(query, page) {
    return new Promise((resolve, reject) => {
        let http = require('http');

        if (!page || page < 1) page = 1;

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

    if (query === undefined) {
        res.status(400).end();
        return;
    }

    lookUp(query, page)
        .then(result => {
            res.send(result);
        });
}

module.exports.route = serve;
