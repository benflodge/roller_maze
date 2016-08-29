define([], function() {

    const keys = {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false
    };

    function onKeyDown (evt) {
        evt.preventDefault();
        switch (evt.keyCode) {
            case 38: // up
            case 87: // w
                keys.moveForward = true;
                break;

            case 37: // left
            case 65: // a
                keys.moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                keys.moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                keys.moveRight = true;
                break;
        }
    }
    
    function onKeyUp (evt) {
        evt.preventDefault();
        switch(evt.keyCode) {
            case 38: // up
            case 87: // w
                keys.moveForward = false;
                break;

            case 37: // left
            case 65: // a
                keys.moveLeft = false;
                break;

            case 40: // down
            case 83: // a
                keys.moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                keys.moveRight = false;
                break;
        }
    }
    
    function addListeners() {
        document.addEventListener( 'keydown', onKeyDown, false );
        document.addEventListener( 'keyup', onKeyUp, false );
    }
    
    function removeListeners() {
        document.removeEventListener( 'keydown', onKeyDown, false );
        document.removeEventListener( 'keyup', onKeyUp, false );
    }
    
    return {
        keys: keys,
        addListeners: addListeners,
        removeListeners: removeListeners
    };
});
