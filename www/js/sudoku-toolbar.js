"use strict"

class SudokuToolbarGrid{
    constructor(num, valid=true){
        this.num = num
        this.valid = valid
        this.dom = bindDiv(this, "", ["sudoku-toolbar-grid"], [])
        this.dom.appendChild(bindDiv(null, "", [], [document.createTextNode(num)]))
        this.dom.tabIndex = "0"
        this.dom._listeners = []
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

    addListener(num, type, listener){
        /*|    num : 1 .. 9     |*/
        this._btnsrc[num].dom._listeners.push([type, listener])
        this._btnsrc[num].dom.addEventListener(type, listener)
    }

    clearBinds(num){
        for (let [type, listener] of this._btnsrc[num].dom._listeners){
            this._btnsrc[num].dom.removeEventListener(type, listener)
        }
    }

    bindClick(num, listener){
        /*|    num : 1 .. 9     |*/
        this.addListener(num, "click", listener)
    }
}
