"use strict"

const NumType = Symbol.for("FreeSudoku-Type-ConcreteNumber")
const EmptyType = Symbol.for("FreeSudoku-Type-Empty")
const AssumeType = Symbol.for("FreeSudoku-Type-Assume")

const NumberSymbol = [ Nothing,
    Symbol.for("FreeSudoku-Number-1"),
    Symbol.for("FreeSudoku-Number-2"),
    Symbol.for("FreeSudoku-Number-3"),
    Symbol.for("FreeSudoku-Number-4"),
    Symbol.for("FreeSudoku-Number-5"),
    Symbol.for("FreeSudoku-Number-6"),
    Symbol.for("FreeSudoku-Number-7"),
    Symbol.for("FreeSudoku-Number-8"),
    Symbol.for("FreeSudoku-Number-9")]

function sym2num(sym){
    let s = Symbol.keyFor(sym)
    return parseInt(s[s.length-1])
}

function SudokuNum(num){
    if (num>0 && num<10){
        return new SudokuGridContent(NumType, NumberSymbol[num])
    } else if (NumberSymbol.includes(num) && num!==Nothing){
        return new SudokuGridContent(NumType, num)
    } else if (num instanceof SudokuGridContent && num.is(NumType)){
        return num
    } else {
        return throwDefaultError()
    }
}
