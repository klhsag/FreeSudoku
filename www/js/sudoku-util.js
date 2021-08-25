"use strict"

const NumType = Symbol.for("FreeSudoku-Type-ConcreteNumber")
const EmptyType = Symbol.for("FreeSudoku-Type-Empty")
const AssumeType = Symbol.for("FreeSudoku-Type-Assume")

// class SudokuGridContent
const SudokuGridContent = createUnionClass([EmptyType, NumType, AssumeType])

function SudokuNum(num){
    if (num>0 && num<10){
        return new SudokuGridContent(NumType, num)
    } else if (num instanceof SudokuGridContent && num.is(NumType)){
        return num
    } else {
        return throwDefaultError()
    }
}
