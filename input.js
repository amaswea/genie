$(document).ready(function () {
    var input = $('#myinput');

    input[0].addEventListener("click", function (evt) {
        console.log("click");
    });

    input[0].addEventListener("dblclick", function (evt) {
        console.log("dblclick");
    });

    input[0].addEventListener("keydown", function (evt) {
        console.log("keydown");
    });

    input[0].addEventListener("keyup", function (evt) {
        console.log("keyup");
    });

    input[0].addEventListener("input", function (evt) {
        console.log("input");
    });

    input[0].addEventListener("keypress", function (evt) {
        console.log("keypress");
    });

    input[0].addEventListener("select", function (evt) {
        console.log("select");
    });

    input[0].addEventListener("change", function (evt) {
        console.log("change");
    });

    input[0].addEventListener("cut", function (evt) {
        console.log("cut");
    });

    input[0].addEventListener("copy", function (evt) {
        console.log("copy");
    });

    input[0].addEventListener("paste", function (evt) {
        console.log("paste");
    });

    input[0].addEventListener("blur", function (evt) {
        console.log("blur");
    });

    input[0].addEventListener("mousedown", function (evt) {
        console.log("mousedown");
    });

    input[0].addEventListener("mouseenter", function (evt) {
        console.log("mouseenter");
    });

    input[0].addEventListener("mouseleave", function (evt) {
        console.log("mouseleave");
    });

    input[0].addEventListener("mousemove", function (evt) {
        console.log("mousemove");
    });

    input[0].addEventListener("mouseout", function (evt) {
        console.log("mouseout");
    });

    input[0].addEventListener("mouseover", function (evt) {
        console.log("mouseover");
    });

    input[0].addEventListener("mouseup", function (evt) {
        console.log("mouseup");
    });


    input[0].addEventListener("wheel", function (evt) {
        console.log("wheel");
    });

    input[0].addEventListener("focus", function (evt) {
        console.log("focus");
    });

    input[0].addEventListener("focusin", function (evt) {
        console.log("focusin");
    });

    input[0].addEventListener("focusout", function (evt) {
        console.log("focusout");
    });

    input[0].addEventListener("scroll", function (evt) {
        console.log("scroll");
    });

    input[0].addEventListener("resize", function (evt) {
        console.log("resize");
    });
    
    input[0].addEventListener("contextmenu", function (evt) {
        console.log("contextmenu");
    });
});