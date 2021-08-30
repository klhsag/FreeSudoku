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
        this._tlist = new MyValueHistory(null)
    }
    _add(new_object){
        this._tlist.current = new_object
    }
    /*
    register(new_obj, new_val){
        new_obj.current = new_val
        this._add(new_obj)
    }*/
    redo(){
        if (this._tlist.canForward()){
            this._tlist.redo()
            this._tlist.current.redo()
        }
    }
    undo(){
        if (!this._tlist.current) return
        this._tlist.current.undo()
        this._tlist.undo()
    }
    fix(){
        this._tlist = new MyValueHistory(null)
    }
}

class MyHookedHistory extends MyValueHistory{
    constructor(root, first, effect){
        super(first, effect)
        this._delegate = root
    }
    get current(){
        return super.current
    }
    set current(new_val){
        if (this._delegate){
            //this._delegate.register(this, new_val)            
            super.current = new_val
            this._delegate._add(this)
        } else {
            super.current = new_val
        }
    }
}