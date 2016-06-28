$(document).ready(function () {
    var textarea = $('#mytextarea1');

    textarea[0].addEventListener("click", function () {
        console.log("click");
    });

    textarea[0].addEventListener("dblclick", function () {
        console.log("dblclick");
    });

    textarea[0].addEventListener("keydown", function (evt) {
        console.log("keydown");
    });

    textarea[0].addEventListener("keyup", function (evt) {
        console.log("keyup");
    });

    textarea[0].addEventListener("input", function () {
        console.log("input");
    });

    textarea[0].addEventListener("keypress", function () {
        console.log("keypress");
    });

    textarea[0].addEventListener("select", function () {
        console.log("select");
    });

    textarea[0].addEventListener("change", function () {
        console.log("change");
    });

    textarea[0].addEventListener("cut", function (evt) {
        console.log("cut");
    });

    textarea[0].addEventListener("copy", function () {
        console.log("copy");
    });

    textarea[0].addEventListener("paste", function () {
        console.log("paste");
    });

    textarea[0].addEventListener("blur", function () {
        console.log("blur");
    });

    textarea[0].addEventListener("mousedown", function () {
        console.log("mousedown");
    });

    /*
    textarea[0].addEventListener("mouseenter", function () {
        console.log("mouseenter");
    });

    textarea[0].addEventListener("mouseleave", function () {
        console.log("mouseleave");
    });

    textarea[0].addEventListener("mousemove", function () {
        console.log("mousemove");
    });

    textarea[0].addEventListener("mouseout", function () {
        console.log("mouseout");
    });

    textarea[0].addEventListener("mouseover", function () {
        console.log("mouseover");
    });*/

    textarea[0].addEventListener("mouseup", function () {
        console.log("mouseup");
    });


    textarea[0].addEventListener("wheel", function () {
        console.log("wheel");
    });

    textarea[0].addEventListener("focus", function () {
        console.log("focus");
    });

    textarea[0].addEventListener("focusin", function () {
        console.log("focusin");
    });

    textarea[0].addEventListener("focusout", function () {
        console.log("focusout");
    });

    textarea[0].addEventListener("scroll", function () {
        console.log("scroll");
    });

    textarea[0].addEventListener("resize", function () {
        console.log("resize");
    });
});