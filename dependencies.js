var globalVar = false;
$(document).ready(function () {
    // TODO: Test different types of event handler registrations

    // Listeners to update dependencies
/*    $(".disable-button1")[0].addEventListener("click", function () {
        if ($('.button1').attr("disabled")) {
            $('.button1').attr("disabled", false);
        } else {
            $(".button1").attr("disabled", true);
        }
    });

    $(".disable-button2")[0].addEventListener("click", function () {
        if ($('.button2').attr("disabled")) {
            $('.button2').attr("disabled", false);
        } else {
            $(".button2").attr("disabled", true);
        }
    });*/

   /* $(".disable-button3").click(function () {
        if ($('.button3').attr("disabled")) {
            $('.button3').attr("disabled", false);
        } else {
            $(".button3").attr("disabled", true);
        }
    });
*/
    // Command Handlers

    // jQuery selectors 
    var test = false;
    var myfunc = function() {
        alert("hello");
    };
    
    var myobj = {
        test: function() {
            alert("testing");
        }
    }
    
    var myfunc2 = function() {
        alert("testing2");
    }
    
    var myfunc3 = function() {
        
    }
    
    $('.button1-dependent')[0].addEventListener('click', function clickButton() {
        // Another comment before the alert
        alert("hello");
        // TEsting if this comment is attached
        myfunc();
        var myvar = 22; 
        test = true;
        myobj.test();
        rotateDown();
        // If button 1 is not disabled, send an alert.
        if (!$('.button1').attr('disabled')) {
            
            // Testing if this second comment is attached
            // This is a comment before the alert.
            myfunc2();
            // This is a comment after the alert
            
            if(test){
                myfunc3();
            }else if(test) {
                myfunc4();
                
                if(test){
                    myfunc5();
                }
            }
        }
        /** 
        This is a block comment 
        */
    });

/*    $('.button2-dependent')[0].addEventListener('click', function (evt, arg2) {
        var disabled = $('.button3').attr('disabled');
        disabled = $('.button2').attr('disabled');
        
        if (!disabled) {
            alert("The button was clicked");
        }
    });*/
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