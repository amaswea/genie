$(document).ready(function () {
    var input = $('#myinput');

    input[0].addEventListener("click", function () {
        console.log("click");
    });

    input[0].addEventListener("dblclick", function () {
        console.log("dblclick");
    });

    input[0].addEventListener("keydown", function () {
        console.log("keydown");
    });

    input[0].addEventListener("keyup", function () {
        console.log("keyup");
    });

    input[0].addEventListener("input", function () {
        console.log("input");
    });

    input[0].addEventListener("keypress", function () {
        console.log("keypress");
    });

    input[0].addEventListener("select", function () {
        console.log("select");
    });

    input[0].addEventListener("change", function () {
        console.log("change");
    });

    input[0].addEventListener("cut", function () {
        console.log("cut");
    });

    input[0].addEventListener("copy", function () {
        console.log("copy");
    });

    input[0].addEventListener("paste", function () {
        console.log("paste");
    });

    input[0].addEventListener("blur", function () {
        console.log("blur");
    });

    input[0].addEventListener("mousedown", function () {
        console.log("mousedown");
    });

    /*
    input[0].addEventListener("mouseenter", function () {
        console.log("mouseenter");
    });

    input[0].addEventListener("mouseleave", function () {
        console.log("mouseleave");
    });

    input[0].addEventListener("mousemove", function () {
        console.log("mousemove");
    });

    input[0].addEventListener("mouseout", function () {
        console.log("mouseout");
    });

    input[0].addEventListener("mouseover", function () {
        console.log("mouseover");
    });*/

    input[0].addEventListener("mouseup", function () {
        console.log("mouseup");
    });


    input[0].addEventListener("wheel", function () {
        console.log("wheel");
    });

    input[0].addEventListener("focus", function () {
        console.log("focus");
    });

    input[0].addEventListener("focusin", function () {
        console.log("focusin");
    });

    input[0].addEventListener("focusout", function () {
        console.log("focusout");
    });

    input[0].addEventListener("scroll", function () {
        console.log("scroll");
    });

    input[0].addEventListener("resize", function () {
        console.log("resize");
    });
});