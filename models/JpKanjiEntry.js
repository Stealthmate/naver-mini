const Util = require("../Util.js");
const WordLink = require("./WordLink.js")
const TranslatedExample = require("./TranslatedExample.js");

class JpKanjiMeaning {
    constructor(m, ex) {
        Util.ensureType(m, Util.types.string);
        this.m = m;

        if (!ex) ex = [];
        Util.ensureType(ex, Util.types.array);
        Util.ensureArrayElementsType(ex, "TranslatedExample");
        this.ex = ex;
    }

    getCompressed() {
        let compressed = {
            m: this.m
        }

        let ex = [];
        for (let i = 0; i < this.ex.length; i++) {
            ex.push(this.ex[i].getCompressed());
        }

        if (ex.length > 0) compressed.ex = ex;
        return compressed;
    }
}

class JpKanjiEntry {
    constructor(kanji, strokes, radical, meanings, kr, onyomi, onex, kunyomi, kunex, partial, more) {
        Util.ensureType(kanji, Util.types.string);
        this.kanji = kanji;

        Util.ensureType(strokes, Util.types.number);
        this.strokes = strokes;

        Util.ensureType(radical, Util.types.string);
        this.radical = radical;

        Util.ensureType(meanings, Util.types.array);
        Util.ensureArrayElementsType(meanings, "JpKanjiMeaning");
        this.meanings = meanings;

        if(!kr) kr = [];
        Util.ensureType(kr, Util.types.array);
        Util.ensureArrayElementsType(kr, Util.types.string);
        this.kr = kr;

        if(!onyomi) onyomi = [];
        Util.ensureType(onyomi, Util.types.array);
        Util.ensureArrayElementsType(onyomi, Util.types.string);
        this.onyomi = onyomi;

        if(!onex) onex = [];
        Util.ensureType(onex, Util.types.array);
        Util.ensureArrayElementsType(onex, "WordLink");
        this.onex = onex;

        if(!kunyomi) kunyomi = [];
        Util.ensureType(kunyomi, Util.types.array);
        Util.ensureArrayElementsType(kunyomi, Util.types.string);
        this.kunyomi = kunyomi;

        if(!kunex) kunex = [];
        Util.ensureType(kunex, Util.types.array);
        Util.ensureArrayElementsType(kunex, "WordLink");
        this.kunex = kunex;

        Util.ensureType(partial, Util.types.boolean);
        this.partial = partial;

        Util.ensureType(more, Util.types.string);
        this.more = more;
    }

    getCompressed() {
        let compressed = {
            kanji: this.kanji,
            strokes: this.strokes,
            radical: this.radical,
            partial: this.partial,
            more: this.more
        };

        let meanings = [];
        for(let i=0;i<this.meanings.length;i++) {
            meanings.push(this.meanings[i].getCompressed());
        }
        if(meanings.length > 0) compressed.meanings = meanings;

        if(this.kr.length > 0) compressed.kr = this.kr;
        if(this.onyomi.length > 0) compressed.onyomi = this.onyomi;
        if(this.kunyomi.length > 0) compressed.kunyomi = this.kunyomi;

        let onex = [];
        for(let i=0;i<this.onex.length;i++) {
            onex.push(this.onex[i].getCompressed());
        }
        if(onex.length > 0) compressed.onex = onex;


        let kunex = [];
        for(let i=0;i<this.kunex.length;i++) {
            kunex.push(this.kunex[i].getCompressed());
        }
        if(kunex.length > 0) compressed.kunex = kunex;

        return compressed;
    }
}

module.exports = JpKanjiEntry;
module.exports.JpKanjiMeaning = JpKanjiMeaning;
module.exports.TranslatedExample = TranslatedExample;
module.exports.WordLink = WordLink;
