const WHITESPACE = /[ \n\t]+/g;

const MOREINFO_WIKTIONARY = "wiktionary";

const Util = module.exports;

const TYPES = {
    string: "String",
    array: "Array",
    boolean: "Boolean",
    number: "Number",
    object: "Object",
    _null: "null",
    _undefined: "undefined"
}

function ensureArrayElementsType(array, type, arrName) {
    ensureType(array, TYPES.array, arrName);
    array.every((element, i, arr) => {
        ensureType(element, type, (arrName ? arrName : "array") + "[" + i + "]");
    });
}

function checkArrayElementsType(array, type) {
    let good = true;
    let asd = array.every((element, i, arr) => {
        good = module.exports.typeOf(element) === type;
    });
    return good;
}

function ensureType(obj, type, objName) {
    if (module.exports.typeOf(obj) !== type) {
        throw new Error("Object" + (objName ? " " + objName : "") + " is of wrong type! " + Util.typeOf(obj) + " should be " + type);
    }
}

function typeOf(obj) {
    if(obj === null) return TYPES._null;
    if(obj === undefined) return TYPES._undefined;
    return obj.constructor.name;
}


module.exports.shrink = function(str) {
    return str.replace(WHITESPACE, " ").trim();
}

module.exports.extractLink = function(link) {
    let str = link;

    if (link.indexOf(MOREINFO_WIKTIONARY) >= 0) {
        return link;
    }

    if (link.indexOf("cc.naver.com") > -1) {
        str = str.substring(str.indexOf("&u=")).substring(3);
        str = decodeURIComponent(str);
    }
    str = str.substring(str.indexOf("/openkr"));
    return str;
}

module.exports.queryNaver = function(reqopt) {
    return new Promise((resolve, reject) => {
        let http = require('http');
        let req = http.request(reqopt, function(res) {
            res.setEncoding('utf8');
            let html = "";
            res.on('data', function(chunk) {
                    html = html + chunk;
                })
                .on('end', () => {
                    resolve(html);
                });
        });
        req.end();
    });
}

module.exports.typeOf = typeOf;
module.exports.ensureType = ensureType;
module.exports.ensureArrayElementsType = ensureArrayElementsType;
module.exports.checkArrayElementsType = checkArrayElementsType;
module.exports.types = TYPES;
