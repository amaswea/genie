$(document).ready(function () {
    $(".test-button").click(function (evt) {
        var target = event.target;
        if (target) {
            var butttonText = target.textContent;
            alert("Clicking the " + butttonText + " button");
        }
    })
});