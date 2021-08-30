"use strict"

const sudokuMaps = [
    ["1-测试", "map-001.js"],
    ["2-教学", "map-002.js"],
    ["3-入门", "map-003.js"],
    ["4-练习", "map-004.js"],
    ["5-简单", "map-005.js"],
    ["6-中等", "map-006.js"],
]

async function getSudokuMapByIdx(idx){
    const filename = sudokuMaps[idx][1]
    if (filename){
        return await getSudokuMapByFilename(filename)
    }
}

async function getSudokuMapByFilename(filename){
    if (filename){
        const module = await import("/js/sudoku-map/"+filename)
        return module.thisMap
    }
}