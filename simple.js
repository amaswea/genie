$(document).ready(function () {
    console.log("running page script");
    var button = $("#button");

    var simpleFunction = function () {
        console.log("simple function was called");
    };

    var otherFunction = function () {
        console.log("another function was called");
    };

    var callSimpleFunction = false;
    var number = 1;
    var getNumber = function () {
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

    $('#button4').click(function () {
        var stateOfButtonTwo = $('#button2').attr("disabled");
        if (!stateOfButtonTwo) {
            alert("The button is not disabled"); 
            $('#button2').attr("disabled", true);
        }
        else {
            alert("The button is disabled");
            $('#button2').attr("disabled", false);
        }
    });
});