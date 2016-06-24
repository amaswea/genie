$(document).ready(function () {
    var button2 = $('#mybutton2')[0];
    button2.addEventListener("click", function() {
        alert("another button added");
    });
    
    var button1 = $('#mybutton')[0];
    button1.addEventListener("click", function() {
       alert("another button added 2"); 
    });
});