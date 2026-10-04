/**
 * @file DissableButton.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Dissable the game feature in Games.html(only on movile and tablet)
 * @date 2026-09-26
 *
 * @copyright Copyright (c) 2026
 *
 */

async function DissableButton(){

    //Get the Button
    const Button = document.getElementById("GameMode");

    //Detect tactile screen
    if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {

        //Dissable the button
        Button.disabled = true;

        Button.classList.add("Dissabled");
        Button.classList.remove("Gamebuttom");
    }
}

//Add an Event so that the function is called when the content is loaded
document.addEventListener("DOMContentLoaded", DissableButton);