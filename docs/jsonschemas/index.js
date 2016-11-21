const SCHEMAS = [
    "./krwordentry.js",
    "./exampleentry.js"
]


module.exports.schemas = [];

function load() {
    SCHEMAS.forEach(schema => {
        module.exports.schemas.push(require(schema));
    })
}


module.exports.reload = function () {
    module.exports.schemas = [];
    SCHEMAS.forEach(i => {
        delete require.cache[require.resolve(i)];
    });
    load();
}

load();
