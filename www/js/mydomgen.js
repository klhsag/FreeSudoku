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

function bindDiv(_o = null, id="", class_list=[], children=[]){
    const block = document.createElement("div")
    if (id) block.id = id
    const str_class_inner = class_list.join(' ')
    if (str_class_inner) block.className = str_class_inner
    for (let kid of children){
        block.appendChild(kid)
    }
    block._object = _o
    return block
}

function bindDivByText(_o = null, id="", class_list=[], text=""){  // you should not actually using default arguments.
    const block = document.createElement("div")
    if (id) block.id = id
    const str_class_inner = class_list.join(' ')
    if (str_class_inner) block.className = str_class_inner
    block.textContent = text
    block._object = _o
    return block
}
