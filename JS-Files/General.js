/**
 * @file General.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Load the navbar, footer and modal window and dissable
 *        current page button in navbar
 * @date 2026-09-26
 *
 * @copyright Copyright (c) 2026
 *
 */

//The index is in the root, the rest of the pages are inside HTML-Files/
const CurrentPage = window.location.pathname.split("/").pop() || "index.html";
const IsIndex     = (CurrentPage === "index.html");

//Path to the common components(Navbar, Footer, Modal window)
const CommonPath  = IsIndex ? "HTML-Files/Common/" : "../HTML-Files/Common/";

async function Load(){

    //Load Navbar
    const navbar = document.getElementById("navbar");

    if (navbar) {

        try {

            const Content    = await fetch(CommonPath + "Navbar.html");
            navbar.innerHTML = await Content.text();

            FixLinksForIndex(navbar);
        }
        catch (error) {

            console.error("Error loading the Navbar:", error);
        }
    }

    //Load Footer
    const footer = document.getElementById("footer");

    if (footer) {

        try {

            const Content    = await fetch(CommonPath + "Footer.html");
            footer.innerHTML = await Content.text();

            FixLinksForIndex(footer);
        }
        catch (error) {

            console.error("Error loading the Footer:", error);
        }
    }

    //Load modal window
    const ModalWindow = document.getElementById("ModalWindow");

    if (ModalWindow) {

        try {

            const Content         = await fetch(CommonPath + "ModalWindow.html");
            ModalWindow.innerHTML = await Content.text();

            FixLinksForIndex(ModalWindow);
        }
        catch (error) {

            console.error("Error loading the ModalWindow:", error);
        }
    }


    //General components loaded event
    document.dispatchEvent(new Event("ComponentsLoaded"));

    DissableCurrentLink();
}

/**
 * The common components are written for the pages inside HTML-Files/.
 * In the index (root) their relative links must be adapted:
 *   "Games.html"      -> "HTML-Files/Games.html"
 *   "../index.html"   -> "index.html"
 */
function FixLinksForIndex(Container) {

    if (!IsIndex || !Container) {

        return;
    }

    Container.querySelectorAll("a[href]").forEach(Link => {

        const Href = Link.getAttribute("href");

        //Skip external links, mailto, tel, anchors and absolute paths
        if (/^(https?:|mailto:|tel:|#|\/)/i.test(Href)) {

            return;
        }

        //"../file" is a file of the root, the rest are inside HTML-Files/
        if (Href.startsWith("../")) {

            Link.setAttribute("href", Href.substring(3));
        }
        else {

            Link.setAttribute("href", "HTML-Files/" + Href);
        }
    });
}

function DissableCurrentLink() {

    //Get all the links
    const Links = document.querySelectorAll("nav .menu a");

    Links.forEach(Link => {

        //If current Link, dissable
        if (Link.getAttribute("href") === CurrentPage) {

            Link.classList.add("CurrentLink");
            Link.removeAttribute("href");
            return;
        }
        //If playing the game dissable the games link
        else if(CurrentPage === "ActualGame.html" && Link.getAttribute("href") === "Games.html"){

            Link.classList.add("CurrentLink");
            Link.removeAttribute("href");
            return;
        }
    });
}

//Add an Event so that the function is called when the content is loaded
document.addEventListener("DOMContentLoaded", Load);