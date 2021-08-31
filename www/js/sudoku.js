"use strict"

class CandidateSet{
    constructor(iterable){
        this._inner = [false, false, false, false, false,
                       false, false, false, false, false]
        for (const num of iterable){
            let u = SudokuNum(num)
            u.dispatch({
                [NumType]: (val)=>{
                    this._inner[val] = true
                }
            })
        }
    }
    has(num){
        return this._inner[num]
    }
    add(num){
        this._inner[num] = true
    }
    delete(num){
        this._inner[num] = false
    }
    values(){
        let ret = []
        for (let i=0; i<10; ++i){
            if (this._inner[i]) ret.push(i)
        }
        return ret
    }
    eq(other){
        return (JSON.stringify(this)==JSON.stringify(other))
    }
}

class SudokuGrid{
    constructor(num){
        this._initial_num = num
        if (this._initial_num == 0){
            this.content = new SudokuGridContent(EmptyType, new CandidateSet([]))
        } else {
            this.content = SudokuNum(this._initial_num)
        }
    }
    eq(other){
        if (this.content.type!=other.content.type) return false
        if (this.content.val.eq) return this.content.val.eq(other.content.val)
        return (this.content.val==other.content.val)
    }
    copy(){
        const c = new SudokuGrid(this._initial_num)
        this.content.dispatch({
            [EmptyType]: (val)=>{
                c.content = new SudokuGridContent(EmptyType, new CandidateSet(val.values()))
            }
        }, ()=>{
            c.content = this.content
        })
        return c
    }
    resetCandidates(iterable){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                if (val.values().length>0){
                    this.content = new SudokuGridContent(EmptyType, new CandidateSet(iterable))
                }
            },
            [AssumeType] : ()=>{
                this.content = new SudokuGridContent(EmptyType, new CandidateSet(iterable))
            }
        })
    }
    addCandidate(num){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                const new_content = new SudokuGridContent(EmptyType, new CandidateSet(val.values()))
                if (!new_content.val.has(num)){
                    new_content.val.add(num)
                    this.content = new_content
                }
            }
        })
    }
    delCandidate(num){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                const new_content = new SudokuGridContent(EmptyType, new CandidateSet(val.values()))
                if (new_content.val.has(num)){
                    new_content.val.delete(num)
                    this.content = new_content
                }
            }
        })
    }
    toggle(num){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                const new_content = new SudokuGridContent(EmptyType, new CandidateSet(val.values()))
                if (new_content.val.has(num)){
                    new_content.val.delete(num)
                }else{
                    new_content.val.add(num)
                }
                this.content = new_content
            }
        })
    }
    assume(num){
        this.content.dispatch({
            [EmptyType] : ()=>{
                this.content = new SudokuGridContent(AssumeType, num)
            },
            [AssumeType] : (val)=>{
                if (num!=val){
                    this.content = new SudokuGridContent(AssumeType, num)
                }
            }
        },()=>{
            console.log('unable to assume')
        })
    }
}

class SudokuUnit{
    constructor(grid, class_list, targetDOM = null){
        this.targetDOM = targetDOM
        this.dom = bindDivByText(this, `sudoku-grid-wrapper-?`, class_list, "?")
        this.dom.tabIndex = "0"                    // allow them to be focus
        this.dom._object = this
        this.connects = []
        this.valid = true
        this.history = new MyValueHistory(undefined)
        if (grid instanceof SudokuGrid){
            this.grid = grid
        } else {
            throw "invalid construct"
        }
    }
    get grid(){
        return this.history.current
    }
    set grid(val){
        this.history.current = val
        this.refreshDOM()
    }
    redo(){
        this.history.redo()
        this.refreshDOM()
    }
    undo(){
        this.history.undo()
        this.refreshDOM()
    }
    delegate(callback){
        const new_grid = this.grid.copy()
        callback(new_grid)
        if (this.grid.eq(new_grid)) return false
        else{
            this.grid = new_grid
            return true
        }
    }
    refreshDOM(){
        this.grid.content.dispatch({
            [EmptyType] : (val)=>{
                const grid_dom = bindDiv(this.grid, "", ["sudoku-candidates-set"], [])
                let vals = val.values()
                if (vals.length == 0){
                    grid_dom.appendChild(document.createTextNode(""))
                }
                for (let i of vals){
                    const candidate_dom = bindDivByText(null, "", [], i)
                    grid_dom.appendChild(candidate_dom)
                }
                this.dom.replaceChildren(grid_dom)
            },
            [NumType] : (val)=>{
                this.dom.replaceChildren(bindDivByText(this.grid, "", [], val))
            },
            [AssumeType]: (val)=>{
                this.dom.replaceChildren(bindDivByText(this.grid, "", ["sudoku-placed"], val))
            }
        })
        this.check_connects_valid()
        if (this.targetDOM && !this.targetDOM.isEqualNode(this.dom)) this.targetDOM.replaceWith(this.dom)
    }
    connect(other){
        if (other!==this && !this.connects.includes(other)) this.connects.push(other)
    }
    get valid(){
        return this._valid
    }
    set valid(_is_valid){
        if (_is_valid){
            this.dom.classList.remove("sudoku-place-wrong")
        } else {
            this.dom.classList.add("sudoku-place-wrong")
        }
        this._valid = _is_valid
    }
    check_valid(){
        if (this.grid.content.type!=AssumeType) {
            this.valid = true
            return;
        }
        let __valid = true
        const number = this.grid.content.val
        for (let other of this.connects){
            other.grid.content.dispatch({
                [EmptyType]: ()=>{},
                [NumType]: (val)=>{
                    if (number==val){
                        __valid = false;
                    }
                },
                [AssumeType]: (val)=>{
                    if (number==val){
                        __valid = false;
                    }
                }
            })
        }
        this.valid = __valid
    }
    check_connects_valid(){
        this.check_valid()
        for (let other of this.connects) other.check_valid()
    }
    excludeCandidates(){
        if (this.grid.content.is(EmptyType)) return []
        const num = this.grid.content.val
        const excluded = []
        for (let other of this.connects){
            other.grid.content.dispatch({
                [EmptyType]: ()=>{
                    const modified = other.delegate((grid)=>{
                        grid.delCandidate(num)
                    })
                    if (modified) excluded.push(other)
                }
            })
        }
        return excluded
    }
}

class Sudoku9x9{
    constructor(initial_union = new MyUnion(Nothing, Nothing)){
        this._complex_history = new MyComplexHistory()
        initial_union.dispatch({
            [Nothing] : ()=>{
                this._raw_data = new Array(9).fill(new Array(9).fill(0))
            }
        })
        this._gbs = undefined
        this.dom = bindDivByText(this, "", ["sudoku-playboard"], "")
        this._init_binds()
        this._load_data(this._raw_data)
    }
    _init_binds(){
        let gridbinds = new Array(9).fill(null).map(()=>{
            return new Array(9).fill(null)
        })
        const boxes = []
        for (let i=0; i<9; ++i){
            boxes.push(bindDivByText(null, "", ["sudoku-grid-box"], ""))
            this.dom.appendChild(boxes[i])
        }
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                const grid_dom_place = document.createElement("div")
                boxes[(i-i%3)+(j-j%3)/3].appendChild(grid_dom_place)
                let _class_list = ["sudoku-grid-wrapper"]
                if (i==0) _class_list.push("sudoku-grid-at-top")
                if (i==8) _class_list.push("sudoku-grid-at-bottom")
                if (j==0) _class_list.push("sudoku-grid-at-left")
                if (j==8) _class_list.push("sudoku-grid-at-right")
                gridbinds[i][j] = new SudokuUnit(new SudokuGrid(0), _class_list, grid_dom_place)
            }
        }
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                for (let k=0; k<9; ++k){
                    gridbinds[i][j].connect(gridbinds[i][k])
                    gridbinds[i][j].connect(gridbinds[k][j])
                }
            }
        }
        for (let i=0; i<9; ++i){
            let sj = i%3
            let si = i - sj
            sj *= 3
            for (let j=0; j<9; ++j){
                let xj = j%3
                let xi = (j - xj)/3
                xi += si
                xj += sj
                for (let k=0; k<9; ++k){
                    let yj = k%3
                    let yi = (k - yj)/3
                    yi += si
                    yj += sj
                    gridbinds[xi][xj].connect(gridbinds[yi][yj])
                    gridbinds[yi][yj].connect(gridbinds[xi][xj])
                }
            }
        }
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                gridbinds[i][j].dom.addEventListener("focusin", ()=>{
                    if (this.activeDOM){
                        this.activeDOM.classList.remove("sudoku-grid-selected")
                    }
                    this.activeDOM = gridbinds[i][j].dom
                    this.activeDOM.classList.add("sudoku-grid-selected")
                })
            }
        }
        this._gbs = gridbinds
    }
    _load_data(data){
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                const num = data[i][j]
                this._gbs[i][j].grid = new SudokuGrid(num)
                this._gbs[i][j].grid.content.dispatch({
                    [NumType]: ()=>{
                        this._gbs[i][j].dom.firstChild.classList.add("sudoku-hint")
                    }
                })
            }
        }
        //this._complex_history.fix()
    }
    completed(){
        let flag = true
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                if (!this._gbs[i][j].valid || this._gbs[i][j].grid.content.is(EmptyType)){
                    flag = false
                    break
                }
            }
        }
        return (flag)
    }
    undo(){
        this._complex_history.undo()
    }
    redo(){
        this._complex_history.redo()
    }
    delegate(grid_unit, grid_callback){
        const grid_changed = grid_unit.delegate(grid_callback)
        if (!grid_changed) return
        let clist = [grid_unit]
        if (grid_unit.grid.content.is(AssumeType)){
            clist = [grid_unit, ...grid_unit.excludeCandidates()]
        }
        const items = []
        for (let u of clist){
            items.push([
                ()=>{},
                ()=>{u.redo()},
                ()=>{u.undo()}
            ])
        }
        this._complex_history.delegate(items)
    }

}

class SudokuPlaceBar extends SudokuToolbar {
    constructor(sudoku_board){
        super()
        for (let i=1; i<=9; ++i){
            this.bindClick(i, ()=>{
                const selected_dom = sudoku_board.activeDOM
                const gridbind = selected_dom._object
                sudoku_board.delegate(gridbind, (grid)=>{
                    grid.assume(i)
                })
                
                if (sudoku_board.completed()){
                    setTimeout(()=>{alert('Congratulations!')}, 100)
                }
            })
        }
    }
}

class SudokuCandidateBar extends SudokuToolbar{
    constructor(sudoku_board){
        super()
        this._board = sudoku_board
        for (let i=1; i<=9; ++i){
            this.bindClick(i, ()=>{
                const selected_dom = sudoku_board.activeDOM
                const gridbind = selected_dom._object
                sudoku_board.delegate(gridbind, (grid)=>{
                    grid.toggle(i)
                })
            })
        }
    }
}

function createBtnClear(sudoku_board){
    const btn = document.createElement("button")
    btn.appendChild(document.createTextNode("清除"))
    btn.type = "button"
    btn.classList.add("sudoku-tool-btn")
    btn.addEventListener("click", ()=>{
        const selected_dom = sudoku_board.activeDOM
        const gridbind = selected_dom._object        
        sudoku_board.delegate(gridbind, (grid)=>{
            grid.resetCandidates([])
        })
    })
    return btn
}

function createBtnUndo(sudoku_board){
    const btn = document.createElement("button")
    btn.appendChild(document.createTextNode("撤销"))
    btn.type = "button"
    btn.classList.add("sudoku-tool-btn")
    btn.addEventListener("click", ()=>{
        sudoku_board.undo()
    })
    return btn
}

function createBtnRedo(sudoku_board){
    const btn = document.createElement("button")
    btn.appendChild(document.createTextNode("恢复"))
    btn.type = "button"
    btn.classList.add("sudoku-tool-btn")
    btn.addEventListener("click", ()=>{
        sudoku_board.redo()
    })
    return btn
}

const defaultFunc = (data)=>{
    console.log("OnLoad start....")
    const sudoku_game_body = new Sudoku9x9()
    sudoku_game_body._load_data(data)
    const gb = document.getElementById("sudoku-gamebox")
    gb.replaceChildren()
    gb.appendChild(sudoku_game_body.dom)
    console.log(sudoku_game_body)
    const candy = new SudokuCandidateBar(sudoku_game_body)
    const bar = new SudokuPlaceBar(sudoku_game_body)
    const btnClear = createBtnClear(sudoku_game_body)
    const btnUndo = createBtnUndo(sudoku_game_body)
    const btnRedo = createBtnRedo(sudoku_game_body)
    const btnGrp = bindDiv(null, "", [], [btnClear, btnUndo, btnRedo])
    btnGrp.style = "display: inline-block"
    const toolDiv = bindDiv(null, "", [], [candy.dom, btnGrp, bar.dom])
    toolDiv.style = "display: flex; justify-content: center; align-items: center"
    gb.appendChild(toolDiv)
    console.log(gb)
}

onLoad(()=>{
    const filename = localStorage.getItem("sudoku-select-filename")
    getSudokuMapByFilename(filename).
        then((data)=>{
            defaultFunc(data)
        })
})
