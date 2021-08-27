"use strict"

class SudokuToolbarGrid{
    constructor(num, valid=true){
        this.num = num
        this.valid = valid
        this.dom = bindDiv(this, "", ["sudoku-toolbar-grid"], [])
        this.dom.appendChild(bindDiv(null, "", [], [document.createTextNode(num)]))
        this.dom.tabIndex = "0"
    }
}

class SudokuToolbar{
    constructor(){
        this._btnsrc = [null]
        for (let i=1; i<=9; ++i){
            this._btnsrc.push(new SudokuToolbarGrid(i))
        }
        this.dom = bindDiv(this, "", ["sudoku-toolbar"], [])
        for (let i=1; i<=9; ++i){
            this.dom.appendChild(this._btnsrc[i].dom)
        }
    }

}
