/**
 * @file player.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Player movement, collisions, animations, sounds and jump effect
 * @date 2026-10-01
 *
 * @copyright Copyright (c) 2026
 *
 */
import { SpriteAnimator } from "./Render.js";

export class Player {
    constructor({
        x,
        y,
        width = 32,
        height = 48,
        speed = 220,
        runSpeed = 340,
        jumpForce = 520,
        gravity = 1500,
        doubleJump = true
    }) {
        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

        this.speed = speed;
        this.runSpeed = runSpeed;

        this.jumpForce = jumpForce;
        this.gravity = gravity;
        this.enableDoubleJump = doubleJump;

        this.velocityX = 0;
        this.velocityY = 0;

        this.onGround = false;
        this.jumpsUsed = 0;

        this.facing = 1;

        //size of the sprite
        this.renderWidth = 32;
        this.renderHeight = 32;

        this.stepTimer = 0;
        this.lastDeltaTime = 0;

        this.jumpEffect = {
            active: false,
            time: 0,
            duration: 0.25,
            particles: []
        };

        //idle, walk, jump or fall
        this.state = "idle";

        this.animations = {
            walk: new SpriteAnimator({
                imagePaths: ["../Assets/Player/1_1.png", "../Assets/Player/1_2.png"],
                frameDuration: 120
            }),
            idle: new SpriteAnimator({
                imagePaths: ["../Assets/Player/1_1.png"],
                frameDuration: 120
            }),
            jump: new SpriteAnimator({
                imagePaths: ["../Assets/Player/1_1.png"],
                frameDuration: 120
            }),
            fall: new SpriteAnimator({
                imagePaths: ["../Assets/Player/1_1.png"],
                frameDuration: 120
            })
        };

        this.audioManager = null;

        this.previousMovementState = "idle";
        this.wasOnGround = false;
    }

    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    updateMovementSounds() {
        if (!this.audioManager)
            return;

        //a timer spaces the steps so a sound is not played every frame
        if (this.onGround && Math.abs(this.velocityX) > 1) {
            if (!this.stepTimer)
                this.stepTimer = 0;

            this.stepTimer -= this.lastDeltaTime;

            if (this.stepTimer <= 0) {
                const isRunning = Math.abs(this.velocityX) >= this.runSpeed;

                this.audioManager.playSound(isRunning ? "run" : "walk");

                this.stepTimer = isRunning ? 0.28 : 0.42;
            }
        } else {
            this.stepTimer = 0;
        }

        this.wasOnGround = this.onGround;
    }

    updateState() {
        //Depending on velocity set jump or fall state
        if (!this.onGround) {
            this.setState(this.velocityY < 0 ? "jump" : "fall");
            return;
        }

        this.setState(Math.abs(this.velocityX) > 1 ? "walk" : "idle");
    }

    setState(newState) {
        if (this.state === newState)
            return;

        this.state = newState;

        //restart the animation of the new state
        const animation = this.animations[newState];

        if (animation)
            animation.reset();
    }

    update(deltaTime, input, level) {
        this.lastDeltaTime = deltaTime;

        const horizontal = input.getHorizontalAxis();
        const currentSpeed = input.isRunning() ? this.runSpeed : this.speed;

        this.velocityX = horizontal * currentSpeed;

        if (horizontal !== 0)
            this.facing = horizontal;

        //first jump on the ground, second jump (if enabled) in the air
        if (input.getJumpPressed()) {
            if (this.onGround) {
                this.audioManager.playSound("jump");
                this.jump();
            } else if (this.enableDoubleJump && this.jumpsUsed < 2) {
                this.audioManager.playSound("jump");
                this.jump();
            }
        }

        this.velocityY += this.gravity * deltaTime;

        const maxFallSpeed = 1000;

        if (this.velocityY > maxFallSpeed)
            this.velocityY = maxFallSpeed;

        //one axis at a time so each collision can be solved on its own
        this.moveHorizontal(deltaTime, level);
        this.moveVertical(deltaTime, level);

        this.updateState();
        this.updateAnimation(deltaTime);
        this.updateJumpEffect(deltaTime);
        this.updateMovementSounds();
    }

    updateAnimation(deltaTime) {
        const animation = this.animations[this.state];

        if (animation)
            animation.update(deltaTime);
    }

    jump() {
        if (this.onGround) {
            this.velocityY = -this.jumpForce;
            this.onGround = false;
            this.jumpsUsed = 1;
            this.startJumpEffect();
        } else if (this.enableDoubleJump && this.jumpsUsed < 2) {
            this.velocityY = -this.jumpForce;
            this.jumpsUsed = 2;
            this.startJumpEffect();
        }
    }

    startJumpEffect() {
        this.jumpEffect.active = true;
        this.jumpEffect.time = 0;
        this.jumpEffect.particles = [];

        const centerX = this.x + this.width / 2;
        const feetY = this.y + this.height;

        //dust particles thrown from the feet in random directions
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI;
            const speed = 25 + Math.random() * 45;

            this.jumpEffect.particles.push({
                x: centerX,
                y: feetY,
                velocityX: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
                velocityY: -Math.random() * 35,
                size: 2 + Math.random() * 3,
                life: 0.15 + Math.random() * 0.1
            });
        }
    }

    updateJumpEffect(deltaTime) {
        if (!this.jumpEffect.active)
            return;

        this.jumpEffect.time += deltaTime;

        for (const particle of this.jumpEffect.particles) {
            particle.x += particle.velocityX * deltaTime;
            particle.y += particle.velocityY * deltaTime;
            particle.velocityY += 100 * deltaTime;
            particle.life -= deltaTime;
        }

        //remove the particles that have run out of life
        this.jumpEffect.particles = this.jumpEffect.particles.filter(particle => particle.life > 0);

        if (this.jumpEffect.time >= this.jumpEffect.duration)
            this.jumpEffect.active = false;
    }

    renderJumpEffect(ctx) {
        if (!this.jumpEffect.active)
            return;

        for (const particle of this.jumpEffect.particles) {
            //the particles fade out as their life runs out
            const alpha = Math.max(0, particle.life / 0.25);

            ctx.save();

            ctx.globalAlpha = alpha;
            ctx.fillStyle = "#e8e8d0";
            ctx.fillRect(
                Math.round(particle.x),
                Math.round(particle.y),
                Math.round(particle.size),
                Math.round(particle.size)
            );

            ctx.restore();
        }
    }

    moveHorizontal(deltaTime, level) {
        this.x += this.velocityX * deltaTime;

        for (const platform of level.platforms) {
            if (this.intersects(this.getBounds(), platform)) {
                if (this.velocityX > 0)
                    this.x = platform.x - this.width;
                else if (this.velocityX < 0)
                    this.x = platform.x + platform.width;

                this.velocityX = 0;
            }
        }

        //keep the player inside the world
        if (this.x < 0)
            this.x = 0;

        if (this.x + this.width > level.width)
            this.x = level.width - this.width;
    }

    moveVertical(deltaTime, level) {
        this.y += this.velocityY * deltaTime;

        this.onGround = false;

        for (const platform of level.platforms) {
            if (this.intersects(this.getBounds(), platform)) {
                if (this.velocityY > 0) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                    this.jumpsUsed = 0;
                } else if (this.velocityY < 0) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
            }
        }

        //falling out of the world sends the player back to the start
        if (this.y > level.height + 300)
            this.respawn();
    }

    respawn() {
        this.x = 150;
        this.y = 300;

        this.velocityX = 0;
        this.velocityY = 0;

        this.jumpsUsed = 0;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    //aabb overlap test between two rectangles
    intersects(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    render(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);

        //the jump effect is drawn behind the player
        this.renderJumpEffect(ctx);

        const animation = this.animations[this.state];

        if (!animation || !animation.loaded)
            return;

        //the sprite is centered on the hitbox and aligned to its feet
        const renderX = x - (this.renderWidth - this.width) / 2;
        const renderY = y - (this.renderHeight - this.height);

        animation.render(ctx, renderX, renderY, this.renderWidth, this.renderHeight, this.facing > 0);
    }
}