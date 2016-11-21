const TranslatedExample = require("./TranslatedExample.js");
const Util = require("../util.js");

class EnMeaning {
    constructor(m, enWord, ex) {
        Util.ensureType(m, Util.types.string);
        this.m = m;

        if(!enWord) enWord=  "";
        Util.ensureType(enWord, Util.types.string);
        this.enWord = enWord;

        if(!ex) ex = [];
        Util.ensureArrayElementsType(ex, "TranslatedExample");
        this.ex = ex;
    }

    getCompressed() {
        let compressed = {
            m: this.m
        };

        if(this.enWord.length > 0) compressed.enWord = this.enWord;

        let ex = [];
        for (let i = 0; i < this.ex.length; i++) {
            ex.push(this.ex[i].getCompressed());
        }
        if (ex.length > 0) compressed.ex = ex;

        return compressed;
    }
}

class EnWordClassGroup {
    constructor(wclass, meanings) {

        if (!wclass) wclass = "";
        Util.ensureType(wclass, Util.types.string);
        this.wclass = wclass;

        Util.ensureArrayElementsType(meanings, "EnMeaning");
        this.meanings = meanings;
    }

    getCompressed() {
        let compressed = {};

        if (this.wclass.length > 0) compressed.wclass = this.wclass;

        let meanings = [];
        for (let i = 0; i < this.meanings.length; i++) {
            meanings.push(this.meanings[i].getCompressed());
        }
        if (meanings.length > 0) compressed.meanings = meanings;

        return compressed;
    }
}

class EnWordEntry {
    constructor(word, pronun, hanja, clsgrps, partial, more) {
        Util.ensureType(word, Util.types.string);
        this.word = word;

        if (!pronun) pronun = "";
        Util.ensureType(pronun, Util.types.string);
        this.pronun = pronun;

        if (!hanja) hanja = "";
        Util.ensureType(hanja, Util.types.string);
        this.hanja = hanja;

        Util.ensureArrayElementsType(clsgrps, "EnWordClassGroup");
        this.clsgrps = clsgrps;

        Util.ensureType(partial, Util.types.boolean);
        this.partial = partial;

        Util.ensureType(more, Util.types.string);
        this.more = more;
    }

    getCompressed() {
        let compressed = {
            word: this.word,
            partial: this.partial,
            more: this.more
        };

        if (this.pronun.length > 0) compressed.pronun = this.pronun;
        if (this.hanja.length > 0) compressed.hanja = this.hanja;

        let clsgrps = [];
        for (let i = 0; i < this.clsgrps.length; i++) {
            clsgrps.push(this.clsgrps[i].getCompressed());
        }
        if (clsgrps.length > 0) compressed.clsgrps = clsgrps;

        return compressed;
    }

}

module.exports = EnWordEntry;
module.exports.EnWordClassGroup = EnWordClassGroup;
module.exports.EnMeaning = EnMeaning;
module.exports.TranslatedExample = TranslatedExample;
