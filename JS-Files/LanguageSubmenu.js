/**
 * @file LanguageSubmenu.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Add the submenu routine to the languages button
 * @date 2026-09-24
 *
 * @copyright Copyright (c) 2026
 *
 */

async function AddSubmenu() {

    const Submenu    = document.getElementById("submenu");
    const MainButton = document.getElementById("Languages-menu");

    //Open or close submenu when LButton is clicked
    window.toggleMenu = function () {

        if (!Submenu.classList.contains("Active")) {
            Submenu.hidden = false;
            Submenu.classList.add("Active");

            MainButton.setAttribute("aria-expanded", "true");
        }
        else {
            Submenu.classList.remove("Active");

            MainButton.setAttribute("aria-expanded", "false");

            //Wait until the animation is over
            setTimeout(() => {
                if (!Submenu.classList.contains("Active"))
                    Submenu.hidden = true;

            }, 250);
        }
    };

    //Close submenu when scroll detected
    window.addEventListener("scroll", () => {
        Submenu.classList.remove("Active");
        Submenu.hidden = true;
        MainButton.setAttribute("aria-expanded", "false");
    });

    //Close submenu when click detected(inside submenu)
    Submenu.addEventListener("click", () => {
        Submenu.classList.remove("Active");
        Submenu.hidden = true;
        MainButton.setAttribute("aria-expanded", "false");
    });
}

//Add an Event so that the function is called when the components are loaded
document.addEventListener("ComponentsLoaded", AddSubmenu);