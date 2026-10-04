/**
 * @file NavMenu.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief close the Nav menu for moviles and tablets under certain conditions
 * @date 2026-10-04
 *
 * @copyright Copyright (c) 2026
 *
 */
document.addEventListener("ComponentsLoaded", async () => {

    try {

        const navToggle = document.getElementById("nav-toggle");
        const navLabel  = document.querySelector(".nav-toggle-label");

        if (navToggle && navLabel) {

            const closeMenu = () => {
                if (navToggle.checked)
                    navToggle.checked = false;
            };

            //Close when clicking outside
            document.addEventListener("click", (event) => {

                if (!navToggle.checked)
                    return;

                const clickedLabel = navLabel.contains(event.target);
                const clickedMenu = event.target.closest("nav, .nav-menu, .navbar");

                //If clicking inside the checkbox let it do its thing
                if (clickedLabel || clickedMenu)
                    return;

                closeMenu();
            });

            //When clicking the link close the window(in case the user goes back later)
            document.addEventListener("click", (event) => {
                if (event.target.closest("nav a, .nav-menu a, .navbar a"))
                    closeMenu();
            });

            //Close when it detects a scroll
            window.addEventListener("scroll", closeMenu, { passive: true });
        }

    }
    catch (error) {
        console.warn(error);
    }
});