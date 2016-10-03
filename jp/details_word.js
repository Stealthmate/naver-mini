/*

An example response looks like this:

class: wordclass,
mean: [
    {
        mean: meaning,
        glosses: [
            gloss: gloss,
            ex: [
                {
                    ex: example,
                    tr: translation,
                }
            ]
        ]
    }
]

*/

const REQUEST_OPTIONS = {
    host: "jpdic.naver.com",
    port: 80,
    path: "/",
    method: 'GET'
};

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

const jsdom = require("jsdom").jsdom;

function parseRuby(el, $) {

    let str = el.find("rp").remove().end().text();
    let rbkanji = el.find("rb");
    let rbfuri = el.find("rt");

    for (let i = 0; i <= rbkanji.length - 1; i++) {
        let kanji = $(rbkanji[i]).text();
        let furigana = $(rbfuri[i]).text();
        if (kanji.length > 0 && furigana.length > 0) str = str.replace(kanji + furigana, "(" + kanji + ";" + furigana + ")");
    }
    return str;
}

function parseDetails(html, resolve) {
    let wnd = jsdom(html).defaultView;
    let $ = require('jquery')(wnd);

    let classSections = $(".section_article");

    let wordclasses = [];

    for (let i = 0; i <= classSections.length - 1; i++) {
        let wordclass = $(classSections[i]).find("h5").text().trim();
        //console.log(" - " + wordclass);
        let meanings = [];
        let meaningContainers = $(classSections[i]).find(".mean_level_2 > li");
        for (let j = 0; j <= meaningContainers.length - 1; j++) {

            let meaning = $(meaningContainers[j]).children(".lst_txt").text().trim();
            //console.log(" - - " + meaning);

            let glosses = [];
            let glossContainers = $(meaningContainers[j]).find(".mean_level_3 > li");

            for (let k = 0; k <= glossContainers.length - 1; k++) {
                let gloss = $(glossContainers[k]).children(".lst_txt").text().trim();
                //console.log(" - - - " + gloss);

                let examples = [];
                let exampleContainers = $(glossContainers[k]).children("p");

                for (let l = 0; l <= exampleContainers.length - 1; l++) {
                    let exampleContainer = $(exampleContainers[l]).children("span");
                    let original = parseRuby($(exampleContainer[1]), $);
                    let translation = parseRuby($(exampleContainer[3]), $);
                    //console.log(" - - - - " + original);
                    //console.log(" - - - - " + translation);

                    let exampleObj = {
                        ex: original,
                        tr: translation
                    };

                    examples.push(exampleObj);
                }
                let glossObj = {
                    gloss: gloss,
                    ex: examples
                };
                glosses.push(glossObj);
            }

            let meaningObj = {
                mean: meaning,
                glosses: glosses
            };
            meanings.push(meaningObj);
        }

        let wordclassObj = {
            "class": wordclass,
            mean: meanings
        };
        wordclasses.push(wordclassObj);
    }

    resolve(wordclasses);

}

function serve(link, page, pagesize) {
    return new Promise((resolve, reject) => {

        let http = require('http');

        REQUEST_OPTIONS.path = "/" + link;

        let req = http.request(REQUEST_OPTIONS, function(res) {
            res.setEncoding('utf8');
            var html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    parseDetails(html, resolve);
                });
        });
        req.end();
    });
}

module.exports = serve;
