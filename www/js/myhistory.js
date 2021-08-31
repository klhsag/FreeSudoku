"use strict"

class MyValueHistory{
    constructor(first, effect=()=>{}){
        this._history = [first]
        this._pos = 0
        this._effect = effect
    }
    get current(){
        return this._history[this._pos]
    }
    set current(new_val){
        while (this._history.length > this._pos + 1){
            this._history.pop()
        }
        this._history.push(new_val)
        this._pos += 1
        this._effect(new_val)             // necessary
    }
    canBack(){
        return (this._pos > 0)
    }
    canForward(){
        return (this._pos + 1 < this._history.length)
    }
    undo(){
        if (this.canBack()) this._pos -= 1
        this._effect(this.current)
    }
    redo(){
        if (this.canForward()) this._pos += 1
        this._effect(this.current)
    }
    fix(){
        const fixed = this.current
        this._history = [fixed]
        this._pos = 0
    }
}

class MyDelegateHistory{
    constructor(){
        this._tlist = new MyValueHistory([null, null])
    }
    register(to_redo, to_undo){
        this._tlist.current = [to_redo, to_undo]
    }
    redo(){
        if (this._tlist.canForward()){
            this._tlist.redo()
            const [todo, _] = this._tlist.current
            todo()
        }
    }
    undo(){
        if (this._tlist.canBack()){
            const [_, todo] = this._tlist.current
            todo()
            this._tlist.undo()
        }
    }
    fix(){
        this._tlist = new MyValueHistory(null)
    }
}

class MyComplexHistory{
    constructor(){
        this.delegator = new MyDelegateHistory()
    }
    delegate(operation_tuples){
        let redoes = ()=>{}
        let undoes = ()=>{}
        for (const [exec, redo, undo] of operation_tuples){
            exec()
            const oldredo = redoes
            redoes = ()=>{
                oldredo()
                redo()
            }
            const oldundo = undoes
            undoes = ()=>{
                oldundo()
                undo()
            }
        }
        this.delegator.register(redoes, undoes)
    }
    redo(){
        this.delegator.redo()
    }
    undo(){
        this.delegator.undo()
    }
    fix(){
        this.delegator = new MyDelegateHistory()
    }
}
