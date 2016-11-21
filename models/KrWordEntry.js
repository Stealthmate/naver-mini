const Util = require("../util.js");

class KrDefinition {
    constructor(def, ex) {
        Util.ensureType(def, Util.types.string);
        this.def = def;

        if(!ex) ex = [];
        Util.ensureArrayElementsType(ex, Util.types.string);
        this.ex = ex;
    }

    getCompressed() {
        let compressed = {
            def: this.def
        };
        if (this.ex.length > 0) compressed.ex = this.ex;

        return compressed;
    }
}

class KrWordEntry {
    constructor(word, hanja, pronun, wclass, defs, partial, more) {
        Util.ensureType(word, Util.types.string);
        this.word = word;

        if (!hanja) hanja = "";
        Util.ensureType(hanja, Util.types.string);
        this.hanja = hanja;

        if (!pronun) pronun = "";
        Util.ensureType(pronun, Util.types.string);
        this.pronun = pronun;

        if (!wclass) wclass = "";
        Util.ensureType(wclass, Util.types.string);
        this.wclass = wclass;

        Util.ensureArrayElementsType(defs, "KrDefinition");
        this.defs = defs;

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
        }

        if (this.hanja.length > 0) compressed.hanja = this.hanja;
        if (this.pronun.length > 0) compressed.pronun = this.pronun;
        if (this.wclass.length > 0) compressed.wclass = this.wclass;

        let defs = [];
        for (let i = 0; i < this.defs.length; i++) {
            defs.push(this.defs[i].getCompressed());
        }
        if (defs.length > 0) compressed.defs = defs;
        return compressed;
    }
}

module.exports = KrWordEntry;
module.exports.KrDefinition = KrDefinition;
