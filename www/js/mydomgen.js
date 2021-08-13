"use strict"

function generateDomBlock(type, id, class_list, content){
    const block = document.createElement(type)
    block.id = id
    const str_class_inner = class_list.join(' ')
    block.className = str_class_inner
    block.innerHTML = content
    return block
}

function createDivBlock(content="", class_list=[], id=""){
    return generateDomBlock("div", id, class_list, content, "")
}
