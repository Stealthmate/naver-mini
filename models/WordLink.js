const Util = require("../util.js");

class WordLink {
    constructor(word, link) {
        Util.ensureType(word, Util.types.string);
        this.word = word;

        Util.ensureType(link, Util.types.string);
        this.link = link;
    }

    getCompressed() {
        return {
            word: this.word,
            lnk: this.link
        };
    }
}

module.exports = WordLink;
