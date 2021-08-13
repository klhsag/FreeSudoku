"use strict"

function generateDomBlock(type, id, class_list, content){
    const block = document.createElement(type)
    if (id) block.id = id
    const str_class_inner = class_list.join(' ')
    if (str_class_inner) block.className = str_class_inner
    block.innerHTML = content
    return block
}

function createDivBlock(content="", class_list=[], id=""){
    return generateDomBlock("div", id, class_list, content, "")
}
