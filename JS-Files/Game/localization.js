/**
 * @file localization.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Get the text from the .txt and place it in the game
 * @date 2026-10-01
 *
 * @copyright Copyright (c) 2026
 *
 */
export class Localization {

    constructor() {

        this.strings = new Map();

        this.path = null;
    }

    //Load text from the .txt into the game
    async load(path) {

        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(
                `Couldn't load the text: ${path} (${response.status})`
            );
        }

        const text = await response.text();

        this.strings = this.parse(text);

        this.path = path;

        return this;
    }

    //Replace the text into the game
    parse(text) {

        const strings = new Map();

        const clean = text.replace(/^﻿/, "");

        for (const rawLine of clean.split(/\r?\n/)) {

            const line = rawLine.trim();

            if ( !line || line.startsWith("#") || line.startsWith("//"))
                continue;


            const separator = line.indexOf("=");

            if (separator === -1)
                continue;


            const key = line.slice(0, separator).trim();
            const value = line.slice(separator + 1).trim();

            if (key)
                strings.set(key, value);
        }

        return strings;
    }

    //Check if it has the key
    has(key) {
        return this.strings.has(key);
    }


    //Get the text lines without the keys(after the =)
    get(key, fallback = key) {

        return this.strings.has(key) ? this.strings.get(key) : fallback;
    }

    //Get the text lines separated by the symbol '|'
    getLines(key) {

        if (!this.strings.has(key))
            return [key];


        const lines = this.strings .get(key)
                                   .split("|")
                                   .map(line => line.trim())
                                   .filter(Boolean);

        return lines.length > 0 ? lines : [key];
    }

    //Substitute the texts in the .html
    apply(root = document) {

        for (const element of root.querySelectorAll("[data-i18n]")) {

            const key = element.dataset.i18n;

            if (!this.has(key))
                continue;

            const attribute = element.dataset.i18nAttr;

            if (attribute)
                element.setAttribute(attribute, this.get(key));
            else
                element.textContent = this.get(key);

        }
    }
}