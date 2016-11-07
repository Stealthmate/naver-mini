const DETAILS_KANJI = "hanja";

function serve(req, res) {

    let link = decodeURIComponent(req.query.lnk);
    let page = undefined;
    let pagesize = undefined;

    let serve = undefined;

    let serveKanji = require('./details_kanji.js');
    let serveWord  = require('./details_word.js');

    if ('page' in req.query) page = parseInt(req.query.page) - 1;
    if ('pagesize' in req.query) pagesize = parseInt(req.query.pagesize);

    if(link.indexOf(DETAILS_KANJI) >= 0) serve = serveKanji(link, page, pagesize);
    else serve = serveWord(link, page, pagesize);

    serve.then(result => {
            let response = result;
            if (page >= 0) {
                let psize = 5;
                if (pagesize > 0) psize = pagesize;

                let reslen = result.length;
                let start = (psize * page);
                let end = start + psize;
                if(end < reslen) {
                    response = result.slice(start, end);
                } else {
                    response = result.slice(start, result.length);
                }
            }
            res.send(response);
        })
        .catch(err => {
            res.status(400).end();
        });
}

module.exports.route = serve;
