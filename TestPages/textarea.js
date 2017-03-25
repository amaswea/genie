/****
 *  Text area event listeners comprehensive test page
 *****/

$(document).ready(function () {
    var textarea = $('#mytextarea1');

    textarea[0].addEventListener("click", function (evt) {
        console.log("click");
    });

    textarea[0].addEventListener("dblclick", function (evt) {
        console.log("dblclick");
    });

    textarea[0].addEventListener("keydown", function (evt) {
        console.log("keydown");
    });

    textarea[0].addEventListener("keyup", function (evt) {
        console.log("keyup");
    });

    textarea[0].addEventListener("input", function (evt)  {
        console.log("input");
    });

    textarea[0].addEventListener("keypress", function (evt) {
        console.log("keypress");
    });

    textarea[0].addEventListener("select", function (evt) {
        console.log("select");
    });

    textarea[0].addEventListener("change", function (evt) {
        console.log("change");
    });

    textarea[0].addEventListener("cut", function (evt) {
        console.log("cut");
    });

    textarea[0].addEventListener("copy", function (evt) {
        console.log("copy");
    });

    textarea[0].addEventListener("paste", function (evt) {
        console.log("paste");
    });

    textarea[0].addEventListener("blur", function (evt) {
        console.log("blur");
    });

    textarea[0].addEventListener("mousedown", function (evt) {
        console.log("mousedown");
    });
 
   textarea[0].addEventListener("mouseenter", function (evt) {
        console.log("mouseenter");
    });

    textarea[0].addEventListener("mouseleave", function (evt) {
        console.log("mouseleave");
    });

    textarea[0].addEventListener("mousemove", function (evt) {
        console.log("mousemove");
    });

    textarea[0].addEventListener("mouseout", function (evt) {
        console.log("mouseout");
    });

    textarea[0].addEventListener("mouseover", function (evt) {
        console.log("mouseover");
    });*/

    textarea[0].addEventListener("mouseup", function (evt) {
        console.log("mouseup");
    });

    textarea[0].addEventListener("wheel", function (evt) {
        console.log("wheel");
    });

    textarea[0].addEventListener("focus", function (evt) {
        console.log("focus");
    });

    textarea[0].addEventListener("focusin", function (evt) {
        console.log("focusin");
    });

    textarea[0].addEventListener("focusout", function (evt) {
        console.log("focusout");
    });

    textarea[0].addEventListener("scroll", function (evt) {
        console.log("scroll");
    });

    textarea[0].addEventListener("resize", function (evt) {
        console.log("resize");
    });

    textarea[0].addEventListener("contextmenu", function (evt) {
        console.log("contextmenu");
    });
});