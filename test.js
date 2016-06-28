$(document).ready(function () {
    var button2 = $('#mybutton2');
    var button1 = $('#mybutton');
    var button4 = $('#mybutton4');
    var textarea = $('#mytextarea1');

    button2[0].addEventListener("click", function () {
        var event = document.createEvent('Event');
        event.initEvent('mouseup', true, true);
        button1[0].dispatchEvent(event);
    });

    button1.mouseup(function () {
        alert("button1 was mouseup");
    });

    button1.click(function () {
        alert("button1 was clicked");
    });

    button4.click(function () {
        console.log("click");
    });

    button4.dblclick(function () {
        console.log("dblclick");
    });

    button4.mouseup(function () {
        console.log("mouseup");
    });

    button4.mousedown(function () {
        console.log("mousedown");
    });

    button4.mouseenter(function () {
        console.log("mouseenter");
    });

    button4.mouseleave(function () {
        console.log("mouseleave");
    });

    button4.mousemove(function () {
        console.log("mousemove");
    });

    button4.mouseout(function () {
        console.log("mouseout");
    });

    button4.mouseover(function () {
        console.log("mouseover");
    });

    button4.mouseup(function () {
        console.log("mouseup");
    });

    button4[0].addEventListener("contextmenu", function () {
        console.log("contextmenu");
    });

    button4[0].addEventListener("wheel", function () {
        console.log("wheel");
    });

    button4[0].addEventListener("pointerenter", function () {
        console.log("pointerenter");
    });

    textarea[0].addEventListener("paste", function () {
        console.log("paste");
    });

    textarea[0].addEventListener("keydown", function () {
        console.log("keydown");
    });

    textarea[0].addEventListener("keyup", function () {
        console.log("keyup");
    });

    textarea[0].addEventListener("input", function () {
        console.log("input");
    });

    textarea[0].addEventListener("keypress", function () {
        console.log("keypress");
    });
});