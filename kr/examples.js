const REQUEST_OPTIONS = {
    host: "krdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET',
    agent: false
};

const QUERY = "%QUERY%";
const PAGE = "%PAGE%";

const URL_TEMPLATE = "/search.nhn?kind=example&query=%QUERY%&page=%PAGE%";

const WHITESPACE = /[ \n\t]+/g;

function parseResult(html, resolve) {
    let $ = require('cheerio').load(html);

    let examples = [];
    let exContainer = $("#content .section > ul > li");
    for (let i = 0; i <= exContainer.length - 1; i++) {
        let exItem = $(exContainer[i]);
        let keyword = exItem.find("span.ex > a > strong").text().trim().replace(WHITESPACE, " ");
        let ex = exItem.find("span").remove(".ex").end().text().trim().replace(WHITESPACE, " ");
        examples.push({
            ex: ex,
            keword: keyword
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
const heapdump = require('heapdump');

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
