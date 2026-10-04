/**
 * @file Audio.js
 * @author ejemplo (ejemplo@gmail.com)
 * @brief Audio manager for the game
 * @date 2026-10-01
 *
 * @copyright Copyright (c) 2026
 *
 */
export class AudioManager {
    constructor() {
        this.muted = false;

        this.music = null;
        this.sounds = new Map();

        this.musicVolume = 0.35;
        this.soundVolume = 0.7;
    }

    //load the background music
    loadMusic(path) {
        this.music = new Audio(path);
        this.music.loop = true;
        this.music.volume = this.musicVolume;
        this.music.preload = "auto";

        return this.music;
    }

    //load the player sounds
    loadSound(name, path) {
        const sound = new Audio(path);

        sound.volume = this.soundVolume;
        sound.preload = "auto";

        this.sounds.set(name, sound);

        return sound;
    }

    playMusic() {
        if (!this.music || this.muted)
            return;

        //play the music
        this.music.play().catch(() => {});
    }

    stopMusic() {
        if (!this.music)
            return;

        //pause and reset the music
        this.music.pause();
        this.music.currentTime = 0;
    }

    playSound(name) {
        if (this.muted)
            return;

        const originalSound = this.sounds.get(name);

        if (!originalSound) {
            console.warn(`Either I am depth or this sound doesn't exist: ${name}`);
            return;
        }

        //play the sound
        const sound = originalSound.cloneNode();
        sound.volume = this.soundVolume;
        sound.play().catch(() => {});
    }

    setMuted(value) {
        this.muted = value;

        if (this.music)
            this.music.muted = value;
    }

    toggleMute() {

        this.setMuted(!this.muted);
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }
}