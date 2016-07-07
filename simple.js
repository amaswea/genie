$(document).ready(function() {
    var button = $("#button");
    
    var simpleFunction = function () {
        console.log("simple function was called");
    };
    
    $("#button").click(function() {
        // Locate the script tags
        simpleFunction();
    });
});