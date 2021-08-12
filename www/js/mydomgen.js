"use strict"

function generateDomString(type, id, class_list, content, extra){
    const str_id = (id) ? `id="${id}"` : ""
    const str_class_inner = class_list.join(' ')
    const str_class = (str_class_inner) ? `class="${str_class_inner}"` : ""
    return `<${type} ${str_id} ${str_class} ${extra}>${content}</${type}>`
}

function getDivHtml(content="", class_list=[], id=""){
    return generateDomString("div", id, class_list, content, "")
}