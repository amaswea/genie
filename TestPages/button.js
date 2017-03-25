/****
 *  Button event listeners program analysis test page
 *****/

$(document).ready(function () {
    var button = $('#mybutton');

    button[0].addEventListener("click", function (evt) {
        console.log("click");
    });

    button[0].addEventListener("click", function (evt) {
        console.log("another click");
    });

    button[0].addEventListener("dblclick", function (evt) {
        console.log("dblclick");
    });

    button[0].addEventListener("keydown", function (evt) {
        console.log("keydown");
    });

    button[0].addEventListener("keyup", function (evt) {
        console.log("keyup");
    });

    button[0].addEventListener("input", function (evt) {
        console.log("input");
    });

    button[0].addEventListener("keypress", function (evt) {
        console.log("keypress");
    });

    button[0].addEventListener("select", function (evt) {
        console.log("select");
    });

    button[0].addEventListener("change", function (evt) {
        console.log("change");
    });

    button[0].addEventListener("cut", function (evt) {
        console.log("cut");
    });

    button[0].addEventListener("copy", function (evt) {
        console.log("copy");
    });

    button[0].addEventListener("paste", function (evt) {
        console.log("paste");
    });

    button[0].addEventListener("blur", function (evt) {
        console.log("blur");
    });

    button[0].addEventListener("mousedown", function (evt) {
        console.log("mousedown");
    });

    button[0].addEventListener("mouseup", function (evt) {
        console.log("mouseup");
    });

    button[0].addEventListener("wheel", function (evt) {
        console.log("wheel");
    });

    button[0].addEventListener("focus", function (evt) {
        console.log("focus");
    });

    button[0].addEventListener("focusin", function (evt) {
        console.log("focusin");
    });

    button[0].addEventListener("focusout", function (evt) {
        console.log("focusout");
    });

    button[0].addEventListener("scroll", function (evt) {
        console.log("scroll");
    });

    button[0].addEventListener("resize", function (evt) {
        console.log("resize");
    });

    button[0].addEventListener("contextmenu", function (evt) {
        console.log("contextmenu");
    });


    element.addEventListener("click", // Alert the disabled state of Button 1 and Button 2                 
        function handleButtonClick(evt) {
            var button2 = $('.button2');
            var disabled1 = $('.button1').attr("disabled");
            // S
            var disabled2 = button2.attr("disabled");
            if (disabled1) {
                // Alert Button 1 disabled
                alert("Button 1 is disabled.");

                if (disabled2) {
                    // Alert Button 2 disabled
                    alert("Button 2 is disabled.");
                } else {
                    // Alert Button 2 not disabled
                    alert("Button 2 is not disabled.");
                }
            } else {
                // Alert Button 1 not disabled
                alert("Button 1 is not disabled.");
            }
        });

    // Rotate the hexagon left <-- Listener comments
    function rotateHexagonLeft() { // <-- Listener name
        if (MainHex && gameState !== 0) {
            // Rotate hexagon left <-- Expression call comments
            MainHex.rotate(1); // <-- Expression call
            
            // Update the hexagon position counter <-- Assignment comments
            MainHex.hexagonPosition--; // <-- Assignment
        }
    }
});