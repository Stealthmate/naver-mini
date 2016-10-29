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
    host: "endic.naver.com",
    port: 80,
    path: "/",
    method: 'GET'
};

const WHITESPACE = /[ \n\t]+/g;

const WORDCLASS = /(^|\n)\[[^\[\]]+\]/g;

function parseExamples(container, $) {
    let exampleContainers = $(container).children("p");

    let examples = [];

    for (let l = 0; l <= exampleContainers.length - 1; l++) {
        let exampleContainer = $(exampleContainers[l]).children("span").remove(".player, .ico_bl").end().children("span");
        let original = parseRuby($(exampleContainer[0]), $);
        let translation = parseRuby($(exampleContainer[1]), $);
        //console.log(" - - - - " + original);
        //console.log(" - - - - " + translation);

        let exampleObj = {
            ex: original,
            tr: translation
        };

        examples.push(exampleObj);
    }

    return examples;
}

function parseDetails(html, resolve) {
    let $ = require('cheerio').load(html);

    let classSections = $(".section_article");

    let word = $(".spot_area .maintitle").text();
    let kanji = $(".spot_area .ps").text();
    kanji = kanji.substring(1, kanji.length-1);
    console.log(word);
    console.log(kanji);



    let wordclasses = [];

    for (let i = 0; i <= classSections.length - 1; i++) {
        let wordclass = $(classSections[i]).find("h5").text().trim();
        //console.log(" - " + wordclass);
        let meanings = [];
        let meaningContainers = $(classSections[i]).find(".mean_level_2 > li, .mean_level_1 > li");
        for (let j = 0; j <= meaningContainers.length - 1; j++) {

            let meaning = parseRuby($(meaningContainers[j]).children(".lst_txt"), $);
            //console.log(" - - " + meaning);

            let glosses = [];
            let glossContainers = $(meaningContainers[j]).find(".mean_level_3 > li");

            for (let k = 0; k <= glossContainers.length - 1; k++) {
                let gloss = $(glossContainers[k]).children(".lst_txt").text().trim();
                //console.log(" - - - " + gloss);

                let examples = parseExamples(glossContainers[k], $);
                let glossObj = {
                    g: gloss,
                    ex: examples
                };
                glosses.push(glossObj);
            }

            let examples = parseExamples(meaningContainers[j], $);

            let meaningObj = {
                m: meaning
            };
            if(glosses.length > 0) meaningObj.gloss = glosses;
            if(examples && examples.length > 0) meaningObj.ex = examples;
            meanings.push(meaningObj);
        }

        let wordclassObj = {
            "class": wordclass,
            mean: meanings
        };
        wordclasses.push(wordclassObj);
    }

    let result = {};
    result.word = word;
    result.kanji = kanji;
    result.meanings = wordclasses;
    resolve(result);

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
