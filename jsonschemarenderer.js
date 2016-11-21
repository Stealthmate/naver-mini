const TEMPLATE_OBJ =
`
<div class="schema">
    <h2 id="schemaTitle">%TITLE</h2>
    %ATTR
</div>
`;

const TEMPLATE_STR =
`
<p>STRING!</p>
`;

function renderObject(obj, level) {
    let html = TEMPLATE_OBJ.replace("%TITLE", obj.title);
    delete obj.title;
    delete obj.$schema;
    let keys = Object.keys(obj.properties);
    let attrhtml = "";
    keys.forEach(key => {
        if(obj.properties[key].type === "string") {
            attrhtml += TEMPLATE_STR;
        }
    });

    return html.replace("%ATTR", attrhtml);
}

function renderArray(arr) {

}

function render(schema) {
    return renderObject(schema, 0);
}

module.exports.render = render;
