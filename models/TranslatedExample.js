const LANGS = {
    KR: "KR",
    JP: "JP",
    EN: "EN"
}

class TranslatedExample {
    constructor(from, to, keyword, ex, tr) {
        this.from = from;
        this.to = to;
        if(!keyword) keyword = "";
        this.keyword = keyword;
        this.ex = ex;
        if(!tr) tr = "";
        this.tr = tr;
    }

    getCompressed() {
        let compressed = {
            from: this.from,
            to: this.to,
            ex: this.ex
        };
        if(this.tr.length > 0) compressed.tr = this.tr;
        if(this.keyword.length > 0) compressed.keyword = this.keyword;

        return compressed;
    }
}

module.exports = TranslatedExample;
module.exports.LANGS = LANGS;
