/**
 * @file camera.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief camera for the game
 * @date 2026-10-01
 *
 * @copyright Copyright (c) 2026
 *
 */
export class Camera {

    constructor({ width, height, worldWidth, worldHeight }) {

        this.x = 0;
        this.y = 0;

        this.width = width;
        this.height = height;

        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }


    follow(player) {

        //Kepp the player in the center
        const targetX = player.x + player.width / 2 - this.width / 2;
        const targetY = player.y + player.height / 2 - this.height / 2;

        //Camera smoothing
        const smoothing = 0.12;
        this.x += (targetX - this.x) * smoothing;
        this.y += (targetY - this.y) * smoothing;
    }


    clamp() {

        //Limit left
        if (this.x < 0)
            this.x = 0;

        //Limit right
        if ( this.x > this.worldWidth - this.width )
            this.x = this.worldWidth - this.width;

        //Limit top
        if (this.y < 0)
            this.y = 0;

        //Limit bot
        if ( this.y > this.worldHeight - this.height )
            this.y = this.worldHeight - this.height;
    }
}
