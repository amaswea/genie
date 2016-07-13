$(document).ready(function () {
    // TODO: Test different types of event handler registrations

    // Listeners to update dependencies
   /* $(".disable-button1").click(function () {
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
    });

    // Command Handlers

    // jQuery selectors 
    $('.button1-dependent').click(function () {
        if (!$('.button1').attr('disabled')) {
            alert("The button was clicked");
        }
    });*/

    $('.button2-dependent').click(function () {
        var disabled = $('.button2').attr('disabled');
        disabled = $('.button3').attr('disabled');
        if (!disabled) {
            alert("The button was clicked");
        }
    });

/*    $('.button3-dependent').click(function () {
        var button = $('.button2');
        var disabled = button.attr('disabled');
        if (!disabled) {
            alert("The button was clicked");
        }
    });*/
});