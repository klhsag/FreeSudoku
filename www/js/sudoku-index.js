"use strict"

function init_sudoku_select_menu(){
    const select_list = document.getElementById("sudoku-select-list")
    for (let [caption, filename] of sudokuMaps){
        const li = document.createElement("li")
        li.appendChild(document.createTextNode(caption))
        li.addEventListener("click", ()=>{
            localStorage.setItem("sudoku-select-filename", filename)
            location.href = "./sudoku.html"
        })
        select_list.appendChild(li)
    }
}

onLoad(init_sudoku_select_menu)