$(document).ready(function () {
    var button2 = $('#mybutton2');
    var button1 = $('#mybutton');
    var button4 = $('#mybutton4');
    var textarea = $('#mytextarea1');

    button2[0].addEventListener("click", function myfunction() {
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

    textarea[0].addEventListener("select", function () {
        console.log("select");
    });

    textarea[0].addEventListener("change", function () {
        console.log("change");
    });

    textarea[0].addEventListener("cut", function () {
        console.log("cut");
    });
    
    textarea[0].addEventListener("copy", function () {
        console.log("copy");
    });
    
        textarea[0].addEventListener("blur", function () {
        console.log("blur");
    });

    var button5 = $("#mybutton5");
    button5.click(function () {
        var newLink = document.createElement("a");
        newLink.classList.add("new-link");
        newLink.href = "www.google.com";
        newLink.textContent = "google";

        document.body.appendChild(newLink);
    });

    var button6 = $("#mybutton6");
    button6.click(function () {
        var remove = $(".new-link").first();
        remove.remove();
    });

    var button7 = $("#mybutton7");
    button7.click(function () {
        var newlink = $(".new-link").first();
        $('#container1').append(newlink);
    });

    var listener = function () {
        alert("hello! ");
    };

    var add = $('#add');
    add.click(function () {
        var clickButton = $('#click')[0];
        clickButton.addEventListener("click", listener);
    });

    var remove = $('#remove');
    remove.click(function () {
        var clickButton = $('#click')[0];
        clickButton.removeEventListener("click", listener);
    });
});