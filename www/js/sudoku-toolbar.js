"use strict"

class SudokuToolbarGrid{
    constructor(num, valid=true){
        this.num = num
        this.valid = valid
        this.dom = createDivBlock(num, ["sudoku-toolbar-grid"])
        this.dom.tabIndex = "0"
    }
}

class SudokuToolbar{
    constructor(){
        this._btnsrc = [null]
        for (let i=1; i<=9; ++i){
            this._btnsrc.push(new SudokuToolbarGrid(i))
        }
        this.dom = createDivBlock("", ["sudoku-toolbar"])
        for (let i=1; i<=9; ++i){
            this.dom.appendChild(this._btnsrc[i].dom)
        }
    }
}
