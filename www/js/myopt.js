"use strict"

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
            $else()
        }
    }
}
