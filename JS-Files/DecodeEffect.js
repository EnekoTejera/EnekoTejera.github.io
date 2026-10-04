/**
 * @file DecodeEffects.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Decode effect for the CS Tittle
 * @date 2026-09-26
 *
 * @copyright Copyright (c) 2026
 *
 */

const DecodeChars = "01";                              //Possible chars to substitute in the Tittle
const Speed       = 0.5;                               //Speed for the decode effect
Tittle            = document.getElementById("Tittle"); //Get the Tittle from the .html
FinalText         = Tittle.textContent;                //Final text the effect has to reach
let Progress      = 0;                                 //Progress of the decode effect

async function Decode() {

  //sanity check in case the text was not loaded at the beggining
  if(FinalText === ""){

    Tittle = document.getElementById("Tittle");
    FinalText = Tittle.textContent;
  }

  //If value lower than the progress decoded, else return random char from DecodeChars
  Tittle.textContent = FinalText.split("").map((Letter, i) => {
      if (i < Progress)
        return Letter;

      return DecodeChars[Math.floor(Math.random() * DecodeChars.length)];
    }
  ).join("");

  //Increase the progress
  Progress += Speed;

  //Check if the decode effect needs to continue or is already finished
  if (Progress < FinalText.length)
    setTimeout(Decode, 50);
  else
    Tittle.textContent = FinalText;
}

//Add an Event so that the function is called when the overlay hides
document.addEventListener("OverlayHide", Decode);
