$(document).ready(function () {
    // TODO: Test different types of event handler registrations

    // Listeners to update dependencies
/*    $(".disable-button1").click(function () {
        if ($('.button1').attr("disabled")) {
            $('.button1').attr("disabled", false);
        } else {
            $(".button1").attr("disabled", true);
        }
    });

    $(".disable-button2").click(function () {
        if ($('.button2').attr("disabled")) {
            $('.button2').attr("disabled", false);
        } else {
            $(".button2").attr("disabled", true);
        }
    });

    $(".disable-button3").click(function () {
        if ($('.button3').attr("disabled")) {
            $('.button3').attr("disabled", false);
        } else {
            $(".button3").attr("disabled", true);
        }
    });*/

    // Command Handlers

    // jQuery selectors 
    var test = false;
    $('.button1-dependent')[0].addEventListener('click', function clickButton() {
       // console.log("click button " + test);
        if (!$('.button1').attr('disabled')) {
            alert("The button was clicked");
        }
    });

    $('.button2-dependent')[0].addEventListener('click', function (evt, arg2) {
        var disabled = $('.button2').attr('disabled');
        disabled = $('.button3').attr('disabled');
        if (!disabled) {
            alert("The button was clicked");
        }
    });
/*
    $('.button3-dependent').click(function () {
        var button = $('.button3');
        var disabled = button.attr('disabled') == "disabled";
        if (!disabled) {
            alert("Button 3 is not disabled");
        }
    });

    // Calling external functions
    $('.button-external-1').click(function () {
        externalFunction();
    });

    $('.button-external-2').click(function () {
        externalFunctionWithDependencies();
    });*/
});