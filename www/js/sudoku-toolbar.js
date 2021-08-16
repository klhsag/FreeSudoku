"use strict"

class SudokuToolbar{
    constructor(){
        this._btnsrc = new Set()
        for (let i=1; i<=9; ++i){
            this._btnsrc.add(new SudokuNum(i))
        }
        this.dom = createDivBlock("", ["sudoku-toolbar"])
        for (const btnsrc of this._btnsrc){
            this.dom.appendChild(createDivBlock(String(sym2num(btnsrc.val)), ["sudoku-toolbar-grid"]))
        }
    }
}
