/**
 * @file interactions.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Manages nearby objects, the interaction text and the dialogues
 * @date 2026-10-01
 *
 * @copyright Copyright (c) 2026
 *
 */
export class InteractionManager {
    //default height above an object where the interaction text goes
    static PROMPT_OFFSET_Y = 28;

    constructor(localization = null) {
        this.localization = localization;

        this.objects = [];
        this.activeObject = null;

        this.dialogue = null;
        this.dialogueIndex = 0;

        this.interactionText = "";

        //if this element does not exist the text is drawn in the canvas
        this.interactionElement = document.getElementById("interaction-message");

        this.dialogueBox = document.getElementById("DialogueBox");
        this.dialogueName = document.getElementById("DialogueName");
        this.dialogueText = document.getElementById("DialogueText");
    }

    t(key, fallback = key) {
        return this.localization
            ? this.localization.get(key, fallback)
            : fallback;
    }

    getLines(key) {
        return this.localization
            ? this.localization.getLines(key)
            : [key];
    }

    //objects need x, y, width and height, and can implement update, render,
    //getInteractionText, interact and promptOffsetY
    add(object) {
        this.objects.push(object);
    }

    updateAnimations(deltaTime) {
        for (const object of this.objects) {
            if (typeof object.update === "function")
                object.update(deltaTime);
        }
    }

    update(player, input, deltaTime = 0) {
        //objects keep animating while a dialogue is open
        this.updateAnimations(deltaTime);

        //with a dialogue open the interact key only advances it
        if (this.dialogue) {
            if (input.getInteractPressed())
                this.nextDialogue();

            return;
        }

        this.activeObject = this.findNearbyObject(player);

        if (this.activeObject)
            this.showInteractionMessage(this.getInteractionText(this.activeObject));
        else
            this.hideInteractionMessage();

        if (this.activeObject && input.getInteractPressed())
            this.interact(this.activeObject, player);
    }

    findNearbyObject(player) {
        const playerCenter = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2
        };

        const interactionDistance = 90;

        let closest = null;
        let closestDistance = Infinity;

        //the closest object within the interaction distance wins
        for (const object of this.objects) {
            //objects with interactable set to false are only decoration
            if (object.interactable === false)
                continue;

            const objectCenter = {
                x: object.x + object.width / 2,
                y: object.y + object.height / 2
            };

            const distance = Math.sqrt(
                Math.pow(playerCenter.x - objectCenter.x, 2) +
                Math.pow(playerCenter.y - objectCenter.y, 2)
            );

            if (distance <= interactionDistance && distance < closestDistance) {
                closest = object;
                closestDistance = distance;
            }
        }

        return closest;
    }

    interact(object, player) {
        if (typeof object.interact === "function")
            object.interact(this, player);
    }

    getInteractionText(object) {
        if (typeof object.getInteractionText === "function")
            return object.getInteractionText(this);

        return this.t("ui.interact", "E — interact");
    }

    startDialogue(name, dialogues) {
        this.dialogue = {name, dialogues};
        this.dialogueIndex = 0;

        this.dialogueBox.classList.remove("hidden");

        this.updateDialogue();
    }

    updateDialogue() {
        const current = this.dialogue.dialogues[this.dialogueIndex];

        this.dialogueName.textContent = this.dialogue.name;
        this.dialogueText.textContent = current;
    }

    nextDialogue() {
        this.dialogueIndex++;

        if (this.dialogueIndex >= this.dialogue.dialogues.length) {
            this.closeDialogue();
            return;
        }

        this.updateDialogue();
    }

    isInDialogue() {
        return this.dialogue !== null;
    }

    closeDialogue() {
        this.dialogue = null;

        this.dialogueBox.classList.add("hidden");
    }

    showInteractionMessage(text) {
        this.interactionText = text;
    }

    hideInteractionMessage() {
        this.interactionText = "";
    }

    render(ctx, player) {
        for (const object of this.objects) {
            if (typeof object.render === "function")
                object.render(ctx, {active: object === this.activeObject});
        }

        //the interaction text is hidden while a dialogue is open
        const showPrompt = this.activeObject && this.interactionText && !this.dialogue;

        if (this.interactionElement) {
            if (showPrompt)
                this.updateInteractionElement(ctx, this.activeObject);
            else
                this.interactionElement.classList.remove("visible");
        } else if (showPrompt) {
            this.renderInteractionText(ctx, this.activeObject);
        }
    }

    //each object can set its own promptOffsetY (npcs use it to replace the "?")
    getPromptOffset(target) {
        return target.promptOffsetY ?? InteractionManager.PROMPT_OFFSET_Y;
    }

    updateInteractionElement(ctx, target) {
        const element = this.interactionElement;
        const canvas = ctx.canvas;

        //world to screen: apply the camera transform, then the css size of the canvas
        const transform = ctx.getTransform();
        const scaleX = canvas.clientWidth / canvas.width;
        const scaleY = canvas.clientHeight / canvas.height;

        const screenX = ((target.x + target.width / 2) * transform.a + transform.e) * scaleX;
        const screenY = ((target.y - this.getPromptOffset(target)) * transform.d + transform.f) * scaleY;

        if (element.textContent !== this.interactionText)
            element.textContent = this.interactionText;

        element.style.left = `${Math.round(screenX)}px`;
        element.style.top = `${Math.round(screenY)}px`;
        element.style.bottom = "auto";
        element.style.transform = "translate(-50%, -100%)";

        element.classList.add("visible");
    }

    //fallback used when there is no html element for the text
    renderInteractionText(ctx, target) {
        const text = this.interactionText;

        ctx.save();

        const transform = ctx.getTransform();

        const centerX = Math.round((target.x + target.width / 2) * transform.a + transform.e);
        const textY = Math.round((target.y - this.getPromptOffset(target)) * transform.d + transform.f);

        //draw in screen coordinates with whole pixels to keep the text sharp
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.font = "bold 14px monospace";

        const paddingX = 10;
        const boxWidth = Math.round(ctx.measureText(text).width + paddingX * 2);
        const boxHeight = 26;
        const boxX = Math.round(centerX - boxWidth / 2);
        const boxY = textY - boxHeight;

        ctx.fillStyle = "rgba(0, 0, 0, 0.80)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, boxX + paddingX, boxY + boxHeight / 2);

        ctx.restore();
    }
}