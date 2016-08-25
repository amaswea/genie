var globalVar = false;

window.onload = function () {
    console.log("testing");
}

$(document).ready(function () {
    // TODO: Test different types of event handler registrations

    // Listeners to update dependencies
/*
    $(".disable-button1")[0].addEventListener("click", function () {
        if ($('.button1').attr("disabled")) {
            $('.button1').attr("disabled", false);
        } else {
            $(".button1").attr("disabled", true);
        }
    });

    $('.button1-dependent')[0].addEventListener('click', function (evt, arg2) {
        // var disabled = $('.button3').attr('disabled');
        if (!$('.button1').attr('disabled')) {
            alert("The button was clicked");
        }
    });
*/

    var callMe = function() {
        alert("The function was called");   
    };
    
    var callMeAgain = function() {
        alert('The function was callled');
    }
    
    $('.button1-dependent')[0].addEventListener('click', function enableTheButton(evt, arg2) {
        // var disabled = $('.button3').attr('disabled');
        var test = false;
        var test2 = false;
        if (!$('.button1').attr('disabled')) {
            alert("The button was clicked");
            callMe();
            if(test){
                test = "Give me the apple";
                alert("Test is true");
                callMeAgain();
                if(test2 == false){
                    test2 = "Give me the bread";
                    alert("Test2 is false");
                }else {
                    alert("Test2 is true");
                    test = "Give me the cookie";
                }
            }else {
                alert("Test is false");
            }
        }
    });


    /*  var myobj = {
          test: false,
          test2: true,
          test3: {
              test4: true
          }
      }

      myobj.test3.test4 = false;
      myobj.test3 = false;

      function mytestfunc() {
          this.x = false;
          this.y = true;
          this.z = false;
      }

      // jQuery selectors 
      this.test = "test";
      var test = false;
      var myfunc = function () {
          alert("hello");
      };



      var myfunc2 = function () {
          alert("testing2");
      }

      var myfunc3 = function () {

      }*/

    /*      $('.button1-dependent')[0].addEventListener('click', function clickButton() {
              // Another comment before the alert
              myobj.test3.test4 = false;
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

                  if (test) {
                      myfunc3();
                  } else if (test) {
                      myfunc4();

                      if (test) {
                          myfunc5();
                      }
                  }
              }
              /** 
              This is a block comment 
              


        var mover = {
            down: false,
            up: false,
            left: false,
            right: false
        }
        $('.button1-dependent')[0].addEventListener('keydown', function handleKeyDown(evt) {
            var storedKeyCode = evt.keyCode;
            storedKeyCode = evt.keyCode;
            if (evt.keyCode == 40) {
                mover.down = true;
            } else if (evt.keyCode == 39) {
                mover.right = true;
            } else if (evt.keyCode == 38) {
                mover.down = true;
            } else if (evt.keyCode == 37) {
                mover.left = true;
            }
            
            if(storedKeyCode == 37){
                mover.left = true;
            }
            
        });*/

    /*    $('.button3-dependent')[0].addEventListener(function () {
            var button = $('.button3');
            var disabled = button.attr('disabled') == "disabled";
            if (!disabled) {
                alert("Button 3 is not disabled");
            }
        });*/

    /*        // Calling external functions
            $('.button-external-1').click(function () {
                externalFunction();
            });

            $('.button-external-2').click(function () {
                externalFunctionWithDependencies();
            });*/
});