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
        if (num == 0){
            this.content = new SudokuGridContent(EmptyType, new CandidateSet([]))
        } else {
            this.content = SudokuNum(num)
        }
    }
    eq(other){
        if (this.content.type!=other.content.type) return false
        if (this.content.val.eq) return this.content.val.eq(other.content.val)
        return (this.content.val==other.content.val)
    }
    copy(){
        const c = new SudokuGrid(0)
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
    toggleCandidate(num){
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
        })
    }
    static delegate(grid, callback){
        const new_grid = grid.copy()
        callback(new_grid)
        if (new_grid.eq(grid)) return grid
        else return new_grid
    }
    static reset(grid, ...numbers){
        return this.delegate(grid, (grid)=>{
            grid.resetCandidates(numbers)
        })
    }
    static collect(grid, num){
        return this.delegate(grid, (grid)=>{
            grid.addCandidate(num)
        })
    }
    static exclude(grid, num){
        return this.delegate(grid, (grid)=>{
            grid.delCandidate(num)
        })
    }
    static toggle(grid, num){
        return this.delegate(grid, (grid)=>{
            grid.toggleCandidate(num)
        })
    }
    static place(grid, num){
        return this.delegate(grid, (grid)=>{
            grid.assume(num)
        })
    }
}

class MyLeafDOM{
    constructor(target){
        this.target = target
    }
    replace(new_dom){
        this.target.replaceWith(new_dom)
        this.target = new_dom
    }
}


class SudokuUnit{
    constructor(leaf, grid, refreshAtOnce=true){
        this.leafNode = leaf
        this.grid = grid
        if (refreshAtOnce) this.refreshDOM()
    }
    eq(other){
        return (this.leafNode===other.leafNode && this.grid.eq(other.grid))
    }
    refreshDOM(){
        let grid_dom = undefined
        this.grid.content.dispatch({
            [EmptyType] : (val)=>{
                grid_dom = bindDiv(this.grid, "", ["sudoku-candidates-set"], [])
                for (let i=1; i<=9; ++i){
                    const candidate_dom = val.has(i)?bindDivByText(null, "", [], i):bindDivByText(null, "", [], "")
                    grid_dom.appendChild(candidate_dom)
                }
            },
            [NumType] : (val)=>{
                grid_dom = bindDivByText(this.grid, "", ["sudoku-hint"], val)
            },
            [AssumeType]: (val)=>{
                grid_dom = bindDivByText(this.grid, "", ["sudoku-placed"], val)
            }
        })
        // grid_dom._object = this
        this.leafNode.replace(grid_dom)
    }
    checkWith(otherUnits){
        let res = true
        if (this.grid.content.type!=AssumeType) return res
        const number = this.grid.content.val
        for (let other of otherUnits){
            other.grid.content.dispatch({
                [EmptyType]: ()=>{},
                [NumType]: (val)=>{
                    if (number==val){
                        res = false;
                    }
                },
                [AssumeType]: (val)=>{
                    if (number==val){
                        res = false;
                    }
                }
            })
        }
        return res
    }
    static delegate(unit, grid_op){
        const new_grid = grid_op(unit.grid)
        if (new_grid.eq(unit.grid)) return unit
        else return new SudokuUnit(unit.leafNode, new_grid, true)
    }

}

const initial_sudoku_map = new Array(9).fill(null).map(()=>{
    return new Array(9).fill(0)
})

const getSudoku9x9Connections = (()=>{
    const gridbinds = new Array(9).fill(null).map(()=>{
        return new Array(9).fill(null)
    })
    for (let i=0; i<9; ++i) for(let j=0; j<9; ++j) gridbinds[i][j] = []
    const new_pair = (arr, pair) => {
        const [a, b] = pair
        const val = a*10+b
        if (!arr.includes(val)) arr.push(val)
    }
    for (let i=0; i<9; ++i){
        for (let j=0; j<9; ++j){
            for (let k=0; k<9; ++k){
                new_pair(gridbinds[i][j], [i, k])
                new_pair(gridbinds[i][j], [k, j])
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
                new_pair(gridbinds[xi][xj], [yi, yj])
                new_pair(gridbinds[yi][yj], [xi, xj])
            }
        }
    }
    for (let i=0; i<9; ++i) for (let j=0; j<9; ++j){
        const vals = gridbinds[i][j]
        const pairs = []
        for (let val of vals){
            if (val!=10*i+j) pairs.push([(val-val%10)/10, val%10])
        }
        gridbinds[i][j] = pairs
    }
    return (x, y) => {return gridbinds[x][y]}
})()

class SudokuUnit9x9Grp{
    constructor(initial_units){
        this._units = new Array(9).fill(null).map(()=>{
            return new Array(9).fill(null)
        })
        for (let i=0; i<9; ++i) for (let j=0; j<9; ++j) this._units[i][j] = initial_units[i][j]
    }
    at(x, y){
        return this._units[x][y]
    }
    set(x, y, new_unit){
        this._units[x][y] = new_unit
    }
    eq(other){
        for (let i=0; i<9; ++i) for (let j=0; j<9; ++j){
            if (!this._units[i][j].eq(other._units[i][j])) return false
        }
        return true
    }
    copy(){
        return new SudokuUnit9x9Grp(this._units)
    }
}

class Sudoku9x9{
    constructor(raw_data = initial_sudoku_map){
        this.dom = bindDivByText(this, "", ["sudoku-playboard"], "")
        this._dom_binds = undefined
        this._init_binds()
        this._load_data(raw_data)
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
                const grid_dom = document.createElement("div")
                boxes[(i-i%3)+(j-j%3)/3].appendChild(grid_dom)
                grid_dom.classList.add("sudoku-grid-wrapper")
                if (i==0) grid_dom.classList.add("sudoku-grid-at-top")
                if (i==8) grid_dom.classList.add("sudoku-grid-at-bottom")
                if (j==0) grid_dom.classList.add("sudoku-grid-at-left")
                if (j==8) grid_dom.classList.add("sudoku-grid-at-right")
                grid_dom.tabIndex = "0"                                      // allow them to be focus
                grid_dom.addEventListener("focusin", ()=>{
                    if (this.activeDOM){
                        this.activeDOM.classList.remove("sudoku-grid-selected")
                    }
                    this.activeDOM = grid_dom
                    this.activeDOM.classList.add("sudoku-grid-selected")
                    this.currentX = i
                    this.currentY = j
                })
                const dom_holder = document.createElement("div")
                grid_dom.appendChild(dom_holder)
                gridbinds[i][j] = new MyLeafDOM(dom_holder)
            }
        }
        this._dom_binds = gridbinds
    }
    _load_data(data){
        const units = new Array(9).fill(null).map(()=>{
            return new Array(9).fill(null)
        })
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                const num = data[i][j]
                units[i][j] = new SudokuUnit(this._dom_binds[i][j], new SudokuGrid(num), true)
            }
        }
        this._grp = new MyValueHistory(new SudokuUnit9x9Grp(units))
    }
    delegate(callback){
        const oldUnitGrp = this._grp.current
        const newUnitGrp = oldUnitGrp.copy()
        callback(newUnitGrp)
        if (newUnitGrp.eq(oldUnitGrp)) return
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                const oldUnit = oldUnitGrp.at(i, j)
                const newUnit = newUnitGrp.at(i, j)
                if (!newUnit.eq(oldUnit)){
                    newUnit.refreshDOM()
                }
            }
        }
        this._grp.current = newUnitGrp
    }
    check_conditions(grp, x, y){
        const cnns = getSudoku9x9Connections(x, y)
        const otherUnits = []
        for (let [u, v] of cnns){
            otherUnits.push(grp.at(u, v))
        }
        const valid = grp.at(x, y).checkWith(otherUnits)
        const node = this._dom_binds[x][y].target.parentNode
        if (valid){
            node.classList.remove("sudoku-place-wrong")
        }else{
            node.classList.add("sudoku-place-wrong")
        }
        for (let [u, v] of cnns){
            const ncnns = getSudoku9x9Connections(u, v)
            const other = grp.at(u, v)
            const anothers = []
            for (let [i, j] of ncnns){
                anothers.push(grp.at(i, j))
            }
            const valid = other.checkWith(anothers)
            const node = this._dom_binds[u][v].target.parentNode
            if (valid){
                node.classList.remove("sudoku-place-wrong")
            }else{
                node.classList.add("sudoku-place-wrong")
            }
        }
    }
    completed(){
        let flag = true
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                const node = this._dom_binds[i][j].target.parentNode
                const grp = this._grp.current
                if (node.classList.contains("sudoku-place-wrong") || grp.at(i, j).grid.content.is(EmptyType)){
                    flag = false
                    break
                }
            }
        }
        return (flag)
    }
    redo(){
        const oldUnitGrp = this._grp.current
        this._grp.redo()
        const newUnitGrp = this._grp.current
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                const oldUnit = oldUnitGrp.at(i, j)
                const newUnit = newUnitGrp.at(i, j)
                if (!newUnit.eq(oldUnit)){
                    newUnit.refreshDOM()
                    this.check_conditions(newUnitGrp, i, j)
                }
            }
        }
    }
    undo(){
        const oldUnitGrp = this._grp.current
        this._grp.undo()
        const newUnitGrp = this._grp.current
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                const oldUnit = oldUnitGrp.at(i, j)
                const newUnit = newUnitGrp.at(i, j)
                if (!newUnit.eq(oldUnit)){
                    newUnit.refreshDOM()
                    this.check_conditions(newUnitGrp, i, j)
                }
            }
        }
    }
    placeNumber(x, y, num){
        this.delegate((grp)=>{
            const tgtUnit = grp.at(x, y)
            const newUnit = SudokuUnit.delegate(tgtUnit, (grid)=>{
                return SudokuGrid.place(grid, num)
            })
            if (newUnit!==tgtUnit){
                grp.set(x, y, newUnit)
                //----------------------- auto exclude
                const cnns = getSudoku9x9Connections(x, y)
                for (let [u, v] of cnns){
                    const otherUnit = grp.at(u, v)
                    const yieldUnit = SudokuUnit.delegate(otherUnit, (grid)=>{
                        return SudokuGrid.exclude(grid, num)
                    })
                    if (yieldUnit!==otherUnit){
                        grp.set(u, v, yieldUnit)
                    }
                }

                //----------------------- check
                this.check_conditions(grp, x, y)
            }
        })
    }
    toggleCandidate(x, y, num){
        this.delegate((grp)=>{
            const tgtUnit = grp.at(x, y)
            const newUnit = SudokuUnit.delegate(tgtUnit, (grid)=>{
                return SudokuGrid.toggle(grid, num)
            })
            if (newUnit!==tgtUnit) grp.set(x, y, newUnit)
        })
    }
    clearUnit(x, y){
        this.delegate((grp)=>{
            const tgtUnit = grp.at(x, y)
            const newUnit = SudokuUnit.delegate(tgtUnit, (grid)=>{
                return SudokuGrid.reset(grid)
            })
            if (newUnit!==tgtUnit){
                grp.set(x, y, newUnit)
                this.check_conditions(grp, x, y)
            }
        })
    }

}


class SudokuPlaceBar extends SudokuToolbar {
    constructor(sudoku_board){
        super()
        for (let i=1; i<=9; ++i){
            this.bindClick(i, ()=>{
                const x = sudoku_board.currentX
                const y = sudoku_board.currentY
                sudoku_board.placeNumber(x, y, i)
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
        for (let i=1; i<=9; ++i){
            this.bindClick(i, ()=>{
                const x = sudoku_board.currentX
                const y = sudoku_board.currentY
                sudoku_board.toggleCandidate(x, y, i)
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
        const x = sudoku_board.currentX
        const y = sudoku_board.currentY
        sudoku_board.clearUnit(x, y)
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
