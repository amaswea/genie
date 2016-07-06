$(document).ready(function() {
    var button = $("#button");
    
    $testns = {}; 
    $testns.simpleFunction = function myfunction() {
        console.log("simple function was called");
    };
    
    $("#button").click(function() {
        // Locate the script tags
        myfunction();
    });
});