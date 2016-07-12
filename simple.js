$(document).ready(function () {
    $("#button").click(function () {
        // Locate the script tags
        var enabled = false;
        var good = true;
        var bad = false;
        if (good ? good : bad) {
            simpleFunction();
        }

        var test = number + 1;
        var test2 = getNumber() + 1;
        console.log(test);
        console.log(test2);
        
        switch(good){
            case 1==1: 
                test = testing; 
            case 2==2: 
                test = testing; 
            default: 
                break;
        }
        
        for(var i=0; i<items.length; i++){
            console.log('testing');
        }
        
    });
});