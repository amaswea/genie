$(document).ready(function () {
    console.log("running page script");
    var button = $("#button");

    var simpleFunction = function () {
        console.log("simple function was called");
    };

    var callSimpleFunction = false;

    $("#button").click(function () {
        // Locate the script tags
        if (callSimpleFunction) {
            simpleFunction();
        }
    });
});