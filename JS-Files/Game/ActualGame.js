/**
 * @file ActualGame.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Main file of the game: setup, input, game loop, update and render
 * @date 2026-10-01
 *
 * @copyright Copyright (c) 2026
 *
 */
import { Input } from "./input.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";
import { Level } from "./level.js";
import { InteractionManager } from "./interactions.js";
import { NPC } from "./npc.js";
import { Painting } from "./Paintings.js";
import { AudioManager } from "./Audio.js";
import { Localization } from "./localization.js";

const OTHER_PAGE    = "../HTML-Files/Games.html";

const canvas        = document.getElementById("gameCanvas");
const ctx           = canvas.getContext("2d");

const muteIndicator = document.getElementById("MuteIndicator");
const audioManager  = new AudioManager();

audioManager.loadMusic("../Assets/Music/music.mp3");
audioManager.loadSound("walk", "../Assets/Music/Walk.wav");
audioManager.loadSound("run", "../Assets/Music/Run.wav");
audioManager.loadSound("jump", "../Assets/Music/Jump.wav");

//internal resolution of the game
const GAME_WIDTH  = 960;
const GAME_HEIGHT = 540;

//the canvas is drawn at RENDER_SCALE times the game resolution so the
//paintings look sharp, it has to be a whole number (1, 2, 3)
const RENDER_SCALE = 2;

canvas.width  = GAME_WIDTH * RENDER_SCALE;
canvas.height = GAME_HEIGHT * RENDER_SCALE;

//keeps the pixel art from looking blurry
ctx.imageSmoothingEnabled = false;

let muted = audioManager.isMuted();

function updateMuteUI() {
    muteIndicator.textContent = muted ? "🔇" : "🔊";
}

function toggleMute() {
    muted = audioManager.toggleMute();

    updateMuteUI();
}

updateMuteUI();

const input = new Input();

const GAME_KEYS = new Set([
    "KeyA",
    "KeyD",
    "KeyW",
    "KeyS",

    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",

    "Space",

    "ShiftLeft",
    "ShiftRight",

    "KeyE",
    "KeyM",

    "Escape"
]);

//these keys are ignored while a dialogue is open
const MOVEMENT_KEYS = [
    "KeyA",
    "KeyD",
    "KeyW",
    "KeyS",

    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",

    "Space",

    "ShiftLeft",
    "ShiftRight"
];

window.addEventListener("keydown", (event) => {
    //stop the browser from scrolling or acting on the game keys
    if (GAME_KEYS.has(event.code))
        event.preventDefault();

    if (event.code === "Escape" && !event.repeat) {
        window.location.href = OTHER_PAGE;
        return;
    }

    if (event.code === "KeyM" && !event.repeat)
        toggleMute();
}, {passive: false});

let audioStarted = false;

//browsers only allow audio after the user interacts with the page
function startAudioAfterInteraction() {
    if (audioStarted)
        return;

    audioStarted = true;
    audioManager.playMusic();
}

window.addEventListener("keydown", startAudioAfterInteraction, {once: true});
canvas.addEventListener("click", startAudioAfterInteraction, {once: true});

canvas.addEventListener("click", () => {
    canvas.focus();
});

//release every key when the canvas loses focus so none stays stuck
canvas.addEventListener("blur", () => {
    input.keys.clear();
    input.previousKeys.clear();
});

//the game starts once the tiled map has loaded
const level = await new Level({mapPath: "../Assets/Levels/Level_1.json"}).loadPromise;

const player = new Player({
    x: 150,
    y: 300,

    width: 32,
    height: 48,

    speed: 220,
    runSpeed: 340,

    jumpForce: 520,
    gravity: 1500,

    doubleJump: true
});

player.setAudioManager(audioManager);

const camera = new Camera({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    worldWidth: level.width,
    worldHeight: level.height
});

const DEFAULT_LANGUAGE = "en";

//language comes from localStorage, then the html lang, then english
function getLanguage() {
    return (
        localStorage.getItem("language") ||
        document.documentElement.lang ||
        DEFAULT_LANGUAGE
    );
}

function getLanguagePath(language) {
    return `../TXT-Files/MyGame_${language}.txt`;
}

const localization = new Localization();

document.addEventListener("TextChanged", async () => {
    try {
        await localization.load(getLanguagePath(getLanguage()));

        localization.apply();
    } catch (error) {
        console.warn(error);
    }
});

try {
    await localization.load(getLanguagePath(getLanguage()));

    localization.apply();
} catch (error) {
    console.warn(error);

    //if the chosen language fails to load, fall back to english
    try {
        await localization.load(getLanguagePath(DEFAULT_LANGUAGE));
    } catch (fallbackError) {
        console.error(fallbackError);
    }
}

const interactions = new InteractionManager(localization);

//load npcs and paintings from the level layers
for (const npcData of level.getNPCs())
    interactions.add(new NPC(npcData));

for (const paintingData of level.getPaintings())
    interactions.add(new Painting(paintingData));

let previousTime = performance.now();

function gameLoop(currentTime) {
    //cap delta time at 33 ms so a lag spike doesn't make the player jump
    const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.033);

    previousTime = currentTime;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    //with a dialogue open the movement keys are blocked
    const suspendedKeys = [];

    if (interactions.isInDialogue()) {
        for (const key of MOVEMENT_KEYS) {
            if (input.keys.has(key)) {
                input.keys.delete(key);
                suspendedKeys.push(key);
            }
        }
    }

    player.update(deltaTime, input, level);

    for (const key of suspendedKeys)
        input.keys.add(key);

    interactions.update(player, input, deltaTime);

    camera.follow(player);
    camera.clamp();

    //saves the key state used to detect new presses
    input.update();
}

function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);

    ctx.save();

    //round the camera to game pixels to avoid thin lines between tiles
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

    level.render(ctx);
    interactions.render(ctx, player);
    player.render(ctx);

    ctx.restore();
}

canvas.focus();

requestAnimationFrame(gameLoop);