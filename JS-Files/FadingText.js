/**
 * @file FadingText.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Function to make the Tittle and links in About-me.html fade
 * @date 2026-09-26
 *
 * @copyright Copyright (c) 2026
 *
 */

const SpeedRatio = 80;

function AddScrollEvent(){

    //Get the elements in the "About-me" introduction
    const IntroductionText = document.getElementById("InitialScreen");
    const Introductionlinks = document.getElementById("IntroductionLinks");

    //Add event listener to the scrolling event
    window.addEventListener("scroll", () => {

        //Get the distance scrolled
        const Scroll = window.scrollY;
        const Height = window.innerHeight;
        const Progress = Math.min(Scroll / (Height * 0.35), 1);

        //Calculate the new opacity based on the distanced scrolled
        const Opacity = 1 - Progress;

        //Apply new opacity
        IntroductionText.style.opacity = Opacity;
        Introductionlinks.style.opacity = Opacity;

        //Apply a small movement to the text
        const move = Progress * SpeedRatio;
        IntroductionText.style.transform = `translateY(${move}px)`;
    });
}