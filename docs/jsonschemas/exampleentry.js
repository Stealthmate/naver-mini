module.exports = {
    "$schema": "http://json-schema.org/draft-04/schema",
    "title": "Example Entry",
    "description": "Defines a Sentence Example Entry format for all dictionaries",
    "type": "object",
    "properties": {
        "ex": {
            "type": "string"
        },
        "keyword": {
            "type": "string"
        },
        "from": {
            "type": "string"
        },
        "to": {
            "type": "string"
        }
    },
    "required": ["ex"]
}
