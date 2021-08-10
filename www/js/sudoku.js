"use strict"

const ErrSymbol = Symbol.for("FreeSudoku-Error")
const NumSymbol = Symbol.for("FreeSudoku-ConcreteNumber")
const EmptySymbol = Symbol.for("FreeSudoku-Empty")

class SudokuGrid{
    constructor(num){
        this._initial_num = num
        if (this._initial_num == 0){
            this.content = new MyUnion(EmptySymbol, Nothing)
        } else if (this._initial_num>0 && this._initial_num<10){
            this.content = new MyUnion(NumSymbol, this._initial_num)
        } else {
            this.content = new MyUnion(ErrSymbol, Nothing)
        }
    }
}