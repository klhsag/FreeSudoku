"use strict"

const ErrType = Symbol.for("Util-Type-Error")
const Nothing = Symbol.for("Nothing")

class MyUnion{
    constructor(key, val = Nothing){
        this.type = key
        this.val = val
    }
    type(){
        return this.type
    }
    is(type){
        return (this.type==type)
    }
    as(type){
        if (this.type==type){
            return this.val
        } else {
            return null
        }
    }
    dispatch(map, $else = ()=>{} ) {
        if (this.type in map){
            map[this.type](this.val)
        } else {
            $else(this.val)
        }
    }
}

function createUnionClass(typelist){
    return class extends MyUnion {
        constructor(key, val = Nothing){
            for (const i of typelist){
                if (key===i){
                    super(key, val)
                    return;
                }
            }
            throw new RangeError('Not valid type for this union')
        }
    }
}

function MyError(info){
    return new MyUnion(ErrType, info)
}

function throwDefaultError(){
    return new MyUnion(ErrType, new Error())
}

function throwMsgError(msg){
    return new MyUnion(ErrType, new Error(msg))
}