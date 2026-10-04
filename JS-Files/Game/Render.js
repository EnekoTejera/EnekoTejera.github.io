/**
 * @file Render.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief load and render the different images(except the level, that goes in the
 * level.js)
 * @date 2026-10-04
 *
 * @copyright Copyright (c) 2026
 *
 */
export class SpriteAnimator {

    constructor({imagePaths = [],frameDuration = 120} = {}) {

        this.imagePaths = imagePaths;
        this.frameDuration = frameDuration;

        this.currentFrame = 0;
        this.elapsedTime = 0;

        this.images = [];
        this.loaded = false;

        this.loadImages();
    }

    //Load the images from the given paths
    loadImages() {

        if (!this.imagePaths ||this.imagePaths.length === 0)
            return;

        let loadedCount = 0;

        for (const imagePath of this.imagePaths) {

            const image = new Image();

            image.onload = () => {

                loadedCount++;

                if (loadedCount === this.imagePaths.length)
                    this.loaded = true;
            };

            image.onerror = () => {

                console.error("Couldn't load:",imagePath);
            };

            image.src = imagePath;

            this.images.push(image);
        }
    }

    update(deltaTime) {

        if (!this.loaded || this.images.length <= 1)
            return;

        this.elapsedTime += deltaTime * 1000;

        //update the animation
        if (this.elapsedTime >= this.frameDuration) {

            this.elapsedTime -= this.frameDuration;

            this.currentFrame++;

            if (this.currentFrame >= this.images.length)
                this.currentFrame = 0;
        }
    }

    //reset the animation
    reset() {

        this.currentFrame = 0;
        this.elapsedTime = 0;
    }

    //render the current frame
    render(ctx,x,y,width,height,flipX = false) {

        if (!this.loaded || this.images.length === 0)
            return false;

        const image = this.images[this.currentFrame];

        ctx.save();

        //if forward vector pointing backguards flip the image
        if (flipX) {

            ctx.translate(x + width, y);

            ctx.scale(-1, 1);

            ctx.drawImage(image,0,0,width,height);

        }
        else
            ctx.drawImage(image,x,y,width,height);

        ctx.restore();

        return true;
    }
}