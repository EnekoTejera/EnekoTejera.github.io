/**
 * @file input.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Handles the input system of the game
 * @date 2026-10-03
 *
 * @copyright Copyright (c) 2026
 *
 */
export class Input {

    //Create the keys listeners
    constructor() {

        this.keys = new Set();
        this.previousKeys = new Set();

        window.addEventListener("keydown", (event) => {
            this.keys.add(event.code);
        });

        window.addEventListener("keyup", (event) => {
            this.keys.delete(event.code);
        });
    }


    //While the key is pressed
    isDown(key) {
        return this.keys.has(key);
    }

    //Only the frame it has been pressed
    isPressed(key) {
        return ( this.keys.has(key) && !this.previousKeys.has(key) );
    }

    //Horizontal movement
    getHorizontalAxis() {

        let axis = 0;

        if ( this.isDown("KeyA") || this.isDown("ArrowLeft") )
            axis -= 1;

        if ( this.isDown("KeyD") || this.isDown("ArrowRight") )
            axis += 1;

        return axis;
    }

    getJumpPressed() {

        return ( this.isPressed("Space") ||
                 this.isPressed("KeyW")  ||
                 this.isPressed("ArrowUp") );
    }

    isRunning() {

        return ( this.isDown("ShiftLeft") || this.isDown("ShiftRight") );
    }

    getInteractPressed() {

        return this.isPressed("KeyE");
    }

    update() {

        this.previousKeys = new Set(this.keys);
    }
}
