/**
 * @file Paintings.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Paintings that the player can examine
 * @date 2026-10-04
 *
 * @copyright Copyright (c) 2026
 *
 */
import { SpriteAnimator } from "./Render.js";

export class Painting {
    constructor({x, y, width, height, name, text, imagePath, interactable = true}) {
        this.type = "painting";

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.name = name;
        this.text = text;
        this.imagePath = imagePath;

        //a painting that is not interactable is only drawn, the manager ignores it
        this.interactable = interactable;

        //height above the npc where the interaction text goes (where the "?" is)
        this.promptOffsetY = 0;

        //a painting is an animator with a single frame
        this.animator = new SpriteAnimator({
            imagePaths: imagePath ? [imagePath] : []
        });

        this.smoothed = false;
    }

    //halve the image several times until it is close to the final size,
    //shrinking a huge image in one step gives jagged edges
    createSmoothImage(image, targetWidth, targetHeight) {
        let source = image;
        let currentWidth = image.naturalWidth;
        let currentHeight = image.naturalHeight;

        while (currentWidth / 2 >= targetWidth && currentHeight / 2 >= targetHeight) {
            currentWidth = Math.floor(currentWidth / 2);
            currentHeight = Math.floor(currentHeight / 2);

            const step = document.createElement("canvas");

            step.width = currentWidth;
            step.height = currentHeight;

            const stepCtx = step.getContext("2d");

            stepCtx.imageSmoothingEnabled = true;
            stepCtx.imageSmoothingQuality = "high";
            stepCtx.drawImage(source, 0, 0, currentWidth, currentHeight);

            source = step;
        }

        return source;
    }

    render(ctx) {
        //once loaded, swap the frame for a smoothed copy (done only once)
        if (this.animator.loaded && !this.smoothed) {
            this.animator.images[0] = this.createSmoothImage(
                this.animator.images[0],
                Math.ceil(this.width * 2),
                Math.ceil(this.height * 2)
            );

            this.smoothed = true;
        }

        //paintings use smoothing, the rest of the game is pixel art
        ctx.save();

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const drawn = this.animator.render(ctx, this.x, this.y, this.width, this.height);

        ctx.restore();

        //black placeholder while the image loads
        if (!drawn) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getInteractionText(manager) {
        return manager.t("ui.examine", "E — Examinar");
    }

    interact(manager) {
        manager.startDialogue(manager.t(this.name), manager.getLines(this.text));
    }
}