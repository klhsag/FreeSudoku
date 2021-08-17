function onLoad(f) {
    if (onLoad.loaded)
        f()
    else{
        window.addEventListener("load", f)
    }
}
onLoad.loaded = false
onLoad(()=>{
    onLoad.loaded = true
})