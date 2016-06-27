$(document).ready(function () {
    var button2 = $('#mybutton2');
    var button1 = $('#mybutton');

    button2[0].addEventListener("click", function () {
        var event = document.createEvent('Event');
        event.initEvent('mouseup', true, true);
        button1[0].dispatchEvent(event);
    });

    button1.mouseup(function () {
        alert("button1 was mouseup");
    });
    
    button1.click(function() {
        alert("button1 was clicked");
    });
});