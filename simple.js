$(document).ready(function () {
    console.log("running page script");
    var button = $("#button");

    var simpleFunction = function () {
        console.log("simple function was called");
    };
    
    var otherFunction = function() {
        console.log("another function was called");  
    };

    var callSimpleFunction = false;
    var number = 1;
    var getNumber = function() {
        return 1; 
    };

    $("#button").click(function () {
        // Locate the script tags
        if (callSimpleFunction) {
            simpleFunction();
        }
        
        var test = number + 1; 
        var test2 = getNumber() + 1; 
        console.log(test); 
        console.log(test2);
    });
    
    button[0].onclick = function() {
        simpleFunction();
    };
    
    button.attr("onclick", "alert('old value')");
    $('#button3').click(function (){
        button.attr("onclick", "alert('testing')");
    });
});