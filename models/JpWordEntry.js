const TranslatedExample = require("./TranslatedExample.js");
const Util = require("../Util.js");

class JpGloss {
    constructor(g, ex) {
        if (Util.typeOf(g) !== Util.types.string)
            throw new Error("g is of wrong type! " + Util.typeOf(g));
        this.g = g;
        if(ex === null || ex === undefined) ex = [];
        Util.ensureType(ex, Util.types.array);
        Util.ensureArrayElementsType(ex, "TranslatedExample");
        this.ex = ex;

    }

    getCompressed() {
        let compressed = {
            g: this.g
        };
        let compressed_ex = [];
        for (let i = 0; i < this.ex.length; i++) {
            compressed_ex.push(this.ex[i].getCompressed());
        }
        if(compressed_ex.length > 0) compressed.ex = compressed_ex;
        return compressed;
    }
};

class JpMeaning {
    constructor(m, glosses) {
        if (m === undefined || m === null)
            m = "";
        if (Util.typeOf(m) !== Util.types.string)
            throw new Error("m is of wrong type! " + Util.typeOf(m));
        this.m = m;
        if(glosses === null || glosses === undefined) glosses = [];
        Util.ensureType(glosses, Util.types.array, "glosses");
        Util.ensureArrayElementsType(glosses, "JpGloss", "glosses");
        this.glosses = glosses;
    }

    getCompressed() {
        let compressed = {};
        if (this.m.length > 0) compressed.m = this.m;
        let compressed_glosses = [];
        for (let i = 0; i < this.glosses.length; i++) {
            compressed_glosses.push(this.glosses[i].getCompressed());
        }
        if(compressed_glosses.length > 0) compressed.glosses = compressed_glosses;
        return compressed;
    }
}

class JpWordClassGroup {
    constructor(wclass, meanings) {
        if (wclass === undefined || wclass === null)
            wclass = "";
        if (Util.typeOf(wclass) !== Util.types.string)
            throw new Error("wclass is of wrong type! " + Util.typeOf(wclass));
        this.wclass = wclass;
        if (Util.typeOf(meanings) !== Util.types.array)
            throw new Error("meanings is of wrong type! " + Util.typeOf(meanings));
        if(!Util.checkArrayElementsType(meanings, "JpMeaning"))
            throw new Error("Not all elements in meanings are JpMeaning!");
        this.meanings = meanings;
    }

    getCompressed() {
        let compressed = {};
        if (this.wclass.length > 0)
            compressed.wclass = this.wclass;

        let compressed_meanings = [];
        for (let i = 0; i < this.meanings.length; i++) {
            compressed_meanings.push(this.meanings[i].getCompressed());
        }
        compressed.meanings = compressed_meanings;
        return compressed;
    }
};

class JpWordEntry {
    constructor(word, kanji, clsgrps, partial, more) {
        if (Util.typeOf(word) !== Util.types.string)
            throw new Error("word is of wrong type! " + Util.typeOf(word));
        this.word = word;
        if (Util.typeOf(kanji) !== Util.types.string)
            throw new Error("kanji is of wrong type! " + Util.typeOf(kanji));
        this.kanji = kanji;
        if (Util.typeOf(clsgrps) !== Util.types.array)
            throw new Error("clsgrps is of wrong type! " + Util.typeOf(clsgrps));
        if(!Util.checkArrayElementsType(clsgrps, "JpWordClassGroup"))
            throw new Error("Not all elements in clsgrps are JpWordClassGroup!");
        this.clsgrps = clsgrps;
        if (Util.typeOf(partial) !== Util.types.boolean)
            throw new Error("partial is of wrong type! " + Util.typeOf(partial));
        this.partial = partial;
        if (Util.typeOf(more) !== Util.types.string)
            throw new Error("more is of wrong type! " + Util.typeOf(more));
        this.more = more;
    }

    getCompressed() {
        let compressed = {
            word: this.word,
            kanji: this.kanji,
            partial: this.partial,
            more: this.more
        }
        let compressed_clsgrps = [];
        for (let i = 0; i < this.clsgrps.length; i++) {
            compressed_clsgrps.push(this.clsgrps[i].getCompressed());
        }

        compressed.clsgrps = compressed_clsgrps;
        return compressed;
    }
};

module.exports = JpWordEntry;
module.exports.JpWordClassGroup = JpWordClassGroup;
module.exports.JpMeaning = JpMeaning;
module.exports.JpGloss = JpGloss;
module.exports.TranslatedExample = TranslatedExample;
