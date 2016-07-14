function externalFunction() {
    alert("Calling external function");
}

function externalFunctionWithDependencies() {
    var disabled = $('.button1').attr("disabled"); 
    if(disabled == "disabled"){
        alert("Button1 is disabled"); 
    }
    else {
        alert("Button1 is not diabled");
    }
}