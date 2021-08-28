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

}

class SudokuGrid{
    constructor(num){
        this._initial_num = num
        this.dom = bindDiv(this, "", [], [document.createTextNode("")])  // must initial this.dom before this.content
        this.history = []
        if (this._initial_num == 0){
            this.content = new SudokuGridContent(EmptyType, new CandidateSet([]))
        } else {
            this.content = SudokuNum(this._initial_num)
        }
    }
    get content(){
        let len = this.history.length
        return this.history[len-1]
    }
    set content(val){
        this.history.push(val)
        this.refreshDOM()
    }
    rollback(){
        this.history.pop()
        this.refreshDOM()
    }
    refreshDOM(){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                let s = ""
                for (let i of val.values()){
                    s += i
                }
                this.dom.firstChild.textContent = s
            },
            [NumType] : (val)=>{
                this.dom.firstChild.textContent = val
            },
            [AssumeType]: (val)=>{
                this.dom.firstChild.textContent = val
                this.dom.classList.add("sudoku-placed")
            }
        })
    }
    resetCandidates(iterable){
        this.content.dispatch({
            [EmptyType] : ()=>{
                this.content = new SudokuGridContent(EmptyType, new CandidateSet(iterable))
            }
        })
    }
    addCandidate(num){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                const new_content = new SudokuGridContent(EmptyType, new CandidateSet(val.values()))
                new_content.val.add(num)
                this.content = new_content
            }
        })
    }
    delCandidate(num){
        this.content.dispatch({
            [EmptyType] : (val)=>{
                const new_content = new SudokuGridContent(EmptyType, new CandidateSet(val))
                new_content.val.delete(num)
                this.content = new_content
            }
        })
    }
    assume(num){
        this.content.dispatch({
            [EmptyType] : ()=>{
                this.content = new SudokuGridContent(AssumeType, num)
            },
            [AssumeType] : ()=>{
                this.content = new SudokuGridContent(AssumeType, num)
            }
        },()=>{
            console.log('unable to assume')
        })
    }
}

class GridBind{
    constructor(grid, class_list, caption = "", connected_grids = []){
        this.dom = bindDivByText(this, `sudoku-grid-wrapper-${caption}`, class_list, "?")
        this.dom.tabIndex = "0"                    // allow them to be focus
        this.dom._object = this
        if (grid instanceof SudokuGrid){
            this.grid = grid
        } else {
            throw "invalid construct"
        }
        this.connects = connected_grids
        this.caption = caption
    }
    get grid(){
        return this._grid
    }
    set grid(new_grid){
        this._grid = new_grid
        this.dom.replaceChildren(this._grid.dom)
    }
    connect(other){
        if (other!==this && !this.connects.includes(other)) this.connects.push(other)
    }
}

class Sudoku9x9{
    constructor(initial_union = new MyUnion(Nothing, Nothing)){
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
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                let _class_list = ["sudoku-grid-wrapper"]
                if (i==0) _class_list.push("sudoku-grid-at-top")
                if (i==8) _class_list.push("sudoku-grid-at-bottom")
                if (j==0) _class_list.push("sudoku-grid-at-left")
                if (j==8) _class_list.push("sudoku-grid-at-right")
                gridbinds[i][j] = new GridBind(new SudokuGrid(0), _class_list, i+""+j)
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
        const boxes = []
        for (let i=0; i<9; ++i){
            boxes.push(bindDivByText(null, "", ["sudoku-grid-box"], ""))
            this.dom.appendChild(boxes[i])
        }
        for (let i=0; i<9; ++i){
            for (let j=0; j<9; ++j){
                boxes[(i-i%3)+(j-j%3)/3].appendChild(gridbinds[i][j].dom)
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
    }
}

class SudokuPlaceBar extends SudokuToolbar {
    constructor(sudoku_board){
        super()
        this._board = sudoku_board
        for (let i=1; i<=9; ++i){
            this.bindClick(i, ()=>{
                const selected_dom = sudoku_board.activeDOM
                const grid = selected_dom._object.grid
                grid.assume(i)
            })
        }
    }
}

onLoad(()=>{
    console.log("OnLoad start....")
    const sudoku_game_body = new Sudoku9x9()
    sudoku_game_body._load_data(sudokumap1)
    const gb = document.getElementById("sudoku-gamebox")
    gb.replaceChildren()
    sudoku_game_body._gbs[1][1].grid.addCandidate(5)
    sudoku_game_body._gbs[1][4].grid.assume(8)
    gb.appendChild(sudoku_game_body.dom)
    console.log(sudoku_game_body)
    const bar = new SudokuPlaceBar(sudoku_game_body)
    gb.appendChild(bar.dom)
    console.log(bar)
    console.log(gb)
});
