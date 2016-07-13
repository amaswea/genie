$(document).ready(function () {
    // TODO: Test different types of event handler registrations

    // Listeners to update dependencies
    $(".disable-button1").click(function () {
        if ($('.button1').attr("disabled")) {
            $('.button1').attr("disabled", false);
        } else {
            $(".button1").attr("disabled", true);
        }
    });

    // Command Handlers
    $('.button1-dependent').click(function () {
        if (!$('.button1').attr('disabled')) {
            alert("The button was clicked");
        }
    });
});