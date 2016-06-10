$(document).ready(function () {
    var buttons = $(".test-button");
    var listener = function() {
        alert("testing");
    }

    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        $(button).on("click", listener);
    }

    $(".remove").click(function () {
        var buttons = $(".test-button");
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            $(button).off("click", listener);
        }
    });
});