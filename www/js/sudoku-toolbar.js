"use strict"

class SudokuToolbar{
    constructor(){
        this._btnsrc = Set()
        for (let i=1; i<=9; ++i){
            this._btnsrc.add(new SudokuNum(i))
        }
    }
}
