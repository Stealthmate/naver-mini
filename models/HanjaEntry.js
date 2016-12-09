const Util = require("../util.js");

class HanjaWord {
    constructor(hanja, hangeul) {
        this.hj = hanja;
        this.hg = hangeul;
    }

    getCompressed() {
        return {
            hj: this.hj,
            hg: this.hg
        };
    }
}

class HanjaEntry {
    constructor(
        hanja,
        readings,
        radical,
        strokes,
        saseongeum,
        difficulty,
        meanings,
        expl,
        glyphexpl,
        reference,
        relHanja,
        strokeDiagram,
        relWords,
        relIdioms,
        partial) {

        Util.ensureType(hanja, Util.types.string);
        this.hanja = hanja;

        Util.ensureArrayElementsType(readings, Util.types.string);
        this.readings = readings;

        Util.ensureType(radical, Util.types.string);
        this.radical = radical;

        Util.ensureType(strokes, Util.types.number);
        this.strokes = strokes;

        if(!saseongeum) saseongeum = [];
        Util.ensureArrayElementsType(saseongeum, Util.types.string);
        this.saseongeum = saseongeum;

        Util.ensureType(difficulty, Util.types.string);
        this.difficulty = difficulty;

        Util.ensureArrayElementsType(meanings, Util.types.string);
        this.meanings = meanings;

        if (!expl) expl = [];
        Util.ensureArrayElementsType(expl, Util.types.string);
        this.expl = expl;

        if (!glyphexpl) glyphexpl = "";
        Util.ensureType(glyphexpl, Util.types.string);
        this.glyphexpl = glyphexpl;

        if (!reference) reference = "";
        Util.ensureType(reference, Util.types.string);
        this.reference = reference;

        if (!relHanja) relHanja = {};
        Util.ensureType(relHanja, Util.types.object);
        this.relHanja = {};
        if ("relShape" in relHanja) {
            Util.ensureArrayElementsType(relHanja.relShape, Util.types.string);
            this.relHanja.relShape = relHanja.relShape;
        }
        if ("relMean" in relHanja) {
            Util.ensureArrayElementsType(relHanja.relMean, Util.types.string);
            this.relHanja.relMean = relHanja.relMean;
        }
        if ("oppMean" in relHanja) {
            Util.ensureArrayElementsType(relHanja.oppMean, Util.types.string);
            this.relHanja.oppMean = relHanja.oppMean;
        }
        if ("diffForm" in relHanja) {
            Util.ensureArrayElementsType(relHanja.diffForm, Util.types.string);
            this.relHanja.diffForm = relHanja.diffForm;
        }

        if(!strokeDiagram) strokeDiagram = [];
        Util.ensureArrayElementsType(strokeDiagram, Util.types.string);
        this.strokeDiagram = strokeDiagram;

        if(!relWords) relWords = [];
        Util.ensureArrayElementsType(relWords, "HanjaWord");
        this.relWords = relWords;

        if(!relIdioms) relIdioms = [];
        Util.ensureArrayElementsType(relIdioms, "HanjaWord");
        this.relIdioms = relIdioms;

        Util.ensureType(partial, Util.types.boolean);
        this.partial = partial;
    }

    getCompressed() {
        let compressed = {
            hanja: this.hanja,
            radical: this.radical,
            strokes: this.strokes,
            difficulty: this.difficulty,
            partial: this.partial
        };

        if (this.saseongeum.length > 0) compressed.saseongeum = this.saseongeum;
        if (this.reference.length > 0) compressed.reference = this.reference;
        if (this.glyphexpl.length > 0) compressed.glyphexpl = this.glyphexpl;
        if (this.readings.length > 0) compressed.readings = this.readings;
        if (this.meanings.length > 0) compressed.meanings = this.meanings;
        if (this.expl.length > 0) compressed.expl = this.expl;
        if (Object.keys(this.relHanja).length > 0) compressed.relHanja = this.relHanja;
        if(this.strokeDiagram.length > 0) compressed.strokeDiagram = this.strokeDiagram;

        let relWords = [];
        for (let i = 0; i < this.relWords.length; i++) {
            relWords.push(this.relWords[i].getCompressed());
        }
        if (relWords.length > 0) compressed.relWords = relWords;

        let relIdioms = [];
        for (let i = 0; i < this.relIdioms.length; i++) {
            relIdioms.push(this.relIdioms[i].getCompressed());
        }
        if (relIdioms.length > 0) compressed.relIdioms = relIdioms;

        return compressed;
    }
}

module.exports = HanjaEntry;
module.exports.HanjaWord = HanjaWord;
