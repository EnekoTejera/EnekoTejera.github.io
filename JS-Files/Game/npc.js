/**
 * @file npc.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Animated npc that the player can talk to
 * @date 2026-10-04
 *
 * @copyright Copyright (c) 2026
 *
 */
import { SpriteAnimator } from "./Render.js";

export class NPC {
    constructor({x, y, width, height, name, dialogueKey, imagePaths = [], fps = 6}) {
        this.type = "npc";

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.name = name;
        this.dialogueKey = dialogueKey;

        //height above the npc where the interaction text goes (where the "?" is)
        this.promptOffsetY = 8;

        //the animator needs the duration of each frame in ms
        this.animator = new SpriteAnimator({
            imagePaths,
            frameDuration: 1000 / fps
        });
    }

    update(deltaTime) {
        this.animator.update(deltaTime);
    }

    render(ctx, {active = false} = {}) {
        const drawn = this.animator.render(ctx, Math.round(this.x), Math.round(this.y), this.width, this.height);

        //placeholder while loading or when the npc has no images
        if (!drawn) {
            ctx.fillStyle = "#b34848";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        //the "?" gives way to the interaction text when the player is close
        if (!active) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "14px monospace";
            ctx.fillText("?", this.x + this.width / 2 - 4, this.y - 10);
        }
    }

    getInteractionText(manager) {
        return manager.t("ui.talk", "E — Hablar");
    }

    interact(manager) {
        manager.startDialogue(manager.t(this.name), manager.getLines(this.dialogueKey));
    }
}