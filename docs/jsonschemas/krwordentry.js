module.exports = {
    "$schema": "http://json-schema.org/draft-04/schema",
    "title": "Korean Word Entry",
    "type": "object",
    "properties": {
        "word": {
            "type": "string"
        },
        "hanja": {
            "type": "string"
        },
        "pronunciation": {
            "type": "string"
        },
        "wclass": {
            "type": "string"
        },
        "partial": {
            "type": "boolean"
        },
        "more": {
            "type": "string"
        },
        "defs": {
            "type": "array",
            "items": [{
                "type": "object",
                "properties": {
                    "def": {
                        "type": "string"
                    },
                    "ex": {
                        "type": "array",
                        "items": [{
                            "type": "string"
                        }]
                    }
                },
                "required": ["def"]
            }],
            "minItems": 1,
            "uniqueItems": true
        }
    },
    "required":["word", "partial", "more", "defs"]
}
