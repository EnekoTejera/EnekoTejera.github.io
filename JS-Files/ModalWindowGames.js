/**
 * @file ModalWindowsGames.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Modal window for the games
 * @date 2026-09-26
 *
 * @copyright Copyright (c) 2026
 *
 */

async function LoadText(txt) {

    //Get the path to the .txt
    const CurrentURL      = document.getElementById("MW").dataset.url;
    //Get the modal window
    const Modal           = document.getElementById("Modal");

    //Get the elements of the modal window
    const ModalTittle     = document.getElementById("ModalTittle");
    const ModalImage0     = document.getElementById("ModalImage0");
    const ModalImage1     = document.getElementById("ModalImage1");
    const ModalImage2     = document.getElementById("ModalImage2");

    const TittleSection0  = document.getElementById("TittleSection0");
    const ModalText0      = document.getElementById("ModalText0");
    const TittleSection1  = document.getElementById("TittleSection1");
    const ModalText1      = document.getElementById("ModalText1");
    const ModalButton     = document.getElementById("ModalButton");

    //Load the .txt
    const SavedLanguage   = localStorage.getItem("language") || document.getElementById("Language").dataset.url;
    const Response        = await fetch(CurrentURL + SavedLanguage +".txt");
    const Text            = await Response.text();

    let Content           = {};
    let ActualSection     = null;

    //Divide the .txt
    Text.split("\n").forEach(Line => {

        //Get the line
        Line = Line.trim();

        //If no line is found, return
        if (!Line)
            return;

        //Get the section
        if (Line.startsWith("[") && Line.endsWith("]")) {

            ActualSection          = Line.slice(1, -1);
            Content[ActualSection] = {};
        }

        //Get the section content
        else if (Line.includes("=") && ActualSection) {

            const [Key, ...TXTData]            = Line.split("=");
            Content[ActualSection][Key.trim()] = TXTData.join("=").trim();
        }
    });

    //Obtain content
    const Data            = Content[txt];
    const ModalLabels     = document.getElementById("ModalLabels");
    ModalLabels.innerHTML = "";

    //Store the labels
    if (Data.Labels) {

        const Labels = Data.Labels.split(",");

        Labels.forEach(Label => {

            const NewLabel = document.createElement("span");
            NewLabel.classList.add("MLabel");
            NewLabel.textContent = Label.trim();
            ModalLabels.appendChild(NewLabel);
        });
    }

    //Store the content of the .txt in the modal window
    ModalTittle.textContent    = Data.Tittle;
    ModalImage0.src            = Data.Image0;
    ModalImage0.alt            = Data.Tittle;
    ModalImage1.src            = Data.Image1;
    ModalImage1.alt            = Data.Tittle;
    ModalImage2.src            = Data.Image2;
    ModalImage2.alt            = Data.Tittle;
    TittleSection0.textContent = Data.SectionTittle0;
    ModalText0.textContent     = Data.ModalText0;
    TittleSection1.textContent = Data.SectionTittle1;
    ModalText1.textContent     = Data.ModalText1;
    ModalButton.href           = Data.Link;
    ModalButton.textContent    = Data.Buttom;

    //Activate the modal window
    Modal.classList.add("Active");

    //Reset the scroll of the modal window
    const modalScroll = document.querySelector("#modal .modal-contenido");
    if (modalScroll) {
        modalScroll.scrollTo({top: 0,left: 0,behavior: "auto"});
    }
}

async function InitMW(){

    //Get the modal window
    const Modal      = document.getElementById("Modal");
    const CloseModal = document.getElementById("CloseModal");

    //Open modal window when the button is pressed
    document.querySelectorAll(".ModalButton").forEach(Button => {

        Button.addEventListener("click", () => {

            LoadText(Button.dataset.id);
        });

    });

    //Close modal window when button is pressed
    CloseModal.addEventListener("click", () => {

        Modal.classList.remove("Active");
    });

    //Close when clicking outside the modal window
    Modal.addEventListener("click", (e) => {

        if (e.target === Modal) {
            Modal.classList.remove("Active");
        }

    });
}

//Add an Event so that the function is called when the components are loaded
document.addEventListener("ComponentsLoaded",InitMW,{ once: true });