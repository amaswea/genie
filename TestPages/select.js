/****
 *  Select event listeners comprehensive test page
 *****/
$(document).ready(function () {
    var select = $('#select');

    select[0].addEventListener("click", function (evt) {
        console.log("click");
    });

    select[0].addEventListener("dblclick", function (evt) {
        console.log("dblclick");
    });

    select[0].addEventListener("keydown", function (evt) {
        console.log("keydown");
    });

    select[0].addEventListener("keyup", function (evt) {
        console.log("keyup");
    });

    select[0].addEventListener("select", function (evt) {
        console.log("select");
    });

    select[0].addEventListener("keypress", function (evt) {
        console.log("keypress");
    });

    select[0].addEventListener("select", function (evt) {
        console.log("select");
    });
    
    select[0].addEventListener("input", function (evt) {
        console.log("input");
    });

    select[0].addEventListener("change", function (evt) {
        console.log("change");
    });

    select[0].addEventListener("cut", function (evt) {
        console.log("cut");
    });

    select[0].addEventListener("copy", function (evt) {
        console.log("copy");
    });

    select[0].addEventListener("paste", function (evt) {
        console.log("paste");
    });

    select[0].addEventListener("blur", function (evt) {
        console.log("blur");
    });

    select[0].addEventListener("mousedown", function (evt) {
        console.log("mousedown");
    });

    select[0].addEventListener("mouseenter", function (evt) {
        console.log("mouseenter");
    });

    select[0].addEventListener("mouseleave", function (evt) {
        console.log("mouseleave");
    });

    select[0].addEventListener("mousemove", function (evt) {
        console.log("mousemove");
    });

    select[0].addEventListener("mouseout", function (evt) {
        console.log("mouseout");
    });

    select[0].addEventListener("mouseover", function (evt) {
        console.log("mouseover");
    });

    select[0].addEventListener("mouseup", function (evt) {
        console.log("mouseup");
    });

    select[0].addEventListener("wheel", function (evt) {
        console.log("wheel");
    });

    select[0].addEventListener("focus", function (evt) {
        console.log("focus");
    });

    select[0].addEventListener("focusin", function (evt) {
        console.log("focusin");
    });

    select[0].addEventListener("focusout", function (evt) {
        console.log("focusout");
    });

    select[0].addEventListener("scroll", function (evt) {
        console.log("scroll");
    });

    select[0].addEventListener("resize", function (evt) {
        console.log("resize");
    });
    
    select[0].addEventListener("contextmenu", function (evt) {
        console.log("contextmenu");
    });
});