$(document).ready(function () {
    var button = $('#mybutton');

    button[0].addEventListener("click", function (evt) {
        console.log("click");
    });

    button[0].addEventListener("dblclick", function () {
        console.log("dblclick");
    });

    button[0].addEventListener("keydown", function () {
        console.log("keydown");
    });

    button[0].addEventListener("keyup", function () {
        console.log("keyup");
    });

    button[0].addEventListener("input", function () {
        console.log("input");
    });

    button[0].addEventListener("keypress", function () {
        console.log("keypress");
    });

    button[0].addEventListener("select", function () {
        console.log("select");
    });

    button[0].addEventListener("change", function () {
        console.log("change");
    });

    button[0].addEventListener("cut", function () {
        console.log("cut");
    });

    button[0].addEventListener("copy", function () {
        console.log("copy");
    });

    button[0].addEventListener("paste", function () {
        console.log("paste");
    });

    button[0].addEventListener("blur", function () {
        console.log("blur");
    });

    button[0].addEventListener("mousedown", function () {
        console.log("mousedown");
    });

    /*
    button[0].addEventListener("mouseenter", function () {
        console.log("mouseenter");
    });

    button[0].addEventListener("mouseleave", function () {
        console.log("mouseleave");
    });

    button[0].addEventListener("mousemove", function () {
        console.log("mousemove");
    });

    button[0].addEventListener("mouseout", function () {
        console.log("mouseout");
    });

    button[0].addEventListener("mouseover", function () {
        console.log("mouseover");
    });*/

    button[0].addEventListener("mouseup", function () {
        console.log("mouseup");
    });


    button[0].addEventListener("wheel", function () {
        console.log("wheel");
    });

    button[0].addEventListener("focus", function () {
        console.log("focus");
    });

    button[0].addEventListener("focusin", function () {
        console.log("focusin");
    });

    button[0].addEventListener("focusout", function () {
        console.log("focusout");
    });

    button[0].addEventListener("scroll", function () {
        console.log("scroll");
    });

    button[0].addEventListener("resize", function () {
        console.log("resize");
    });
});