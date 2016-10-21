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

const WHITESPACE = /[ \n\t]+/g;

function deflateStr(str) {
    return str.replace(WHITESPACE, " ");
}

module.exports.parseRuby = parseRuby;
module.exports.deflateStr = deflateStr;
