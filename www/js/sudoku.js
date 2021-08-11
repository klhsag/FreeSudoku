"use strict"

const NumType = Symbol.for("FreeSudoku-Type-ConcreteNumber")
const EmptyType = Symbol.for("FreeSudoku-Type-Empty")
const AssumeType = Symbol.for("FreeSudoku-Type-Assume")

// class SudokuGridContent
const SudokuGridContent = createUnionClass([EmptyType, NumType, AssumeType])

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

class CandidateSet{
    constructor(iterable){
        console.log("at least...")
        this._inner = new Set()
        for (const num of iterable){
            let u = SudokuNum(num)
            console.log(u)
            u.dispatch({
                [NumType]: (val)=>{
                    this._inner.add(val)
                }
            })
        }
    }
    has(numSym){
        return this._inner.has(numSym)
    }
    add(numSym){
        this._inner.add(numSym)
    }
    delete(numSym){
        this._inner.delete(numSym)
    }
    values(){
        return this._inner.values()
    }

}

class SudokuGrid{
    constructor(num){
        this._initial_num = num
        this.history = []
        if (this._initial_num == 0){
            this.content = new SudokuGridContent(EmptyType, new CandidateSet([]))
        } else if (this._initial_num>0 && this._initial_num<10){
            this.content = SudokuNum(this._initial_num)
        } else {
            this.content = throwDefaultError()
        }
    }
    get content(){
        let len = this.history.length
        return this.history[len-1]
    }
    set content(val){
        this.history.push(val)
    }
    rollback(){
        this.history.pop()
    }
    //_clearly_call(callback){
    //    this.rollback()
    //    callback()
    //}
    resetCandidates(iterable){
        this.content.dispatch({
            [EmptyType] : ()=>{
                this.content = new SudokuGridContent(EmptyType, new CandidateSet(iterable))
            }
        })
    }
    addCandidate(numSym){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                val.add(numSym)
            }
        })
    }
    delCandidate(numSym){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                val.delete(numSym)
            }
        })
    }
    assume(numSym){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                this.content = new SudokuGridContent(AssumeType, numSym)
            }
        })
    }
}