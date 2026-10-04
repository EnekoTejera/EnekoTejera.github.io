/**
 * @file LanguageLoader.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Loads the text depending on the choosen language
 * @date 2026-09-28
 *
 * @copyright Copyright (c) 2026
 *
 */
const CurrentURL = document.getElementById("LanguageURL").dataset.url; //Txt URL
const MyEvent = new Event("TextChanged")

async function LoadLanguage(Language) {

    try {
        const File = await fetch( CurrentURL + Language + ".txt");

        if (!File.ok) {
            throw new Error( `LoadLanguage: Could not load the TXT`);
        }

        //Get the text
        const FileText = await File.text();
        const Text = ParseTranslations(FileText);

        //Change the .html with the extracted texts
        ApplyTranslations(Text);

        localStorage.setItem("language", Language);

        //Load the YT Consent text
        if(window.location.pathname.split("/").pop() === "Games.html")
            window.YTConsentRefresh();

        document.dispatchEvent(MyEvent);
    }
    catch (error) {

        console.error(error);
    }
}

function ParseTranslations(text) {

    const Text = {};

    //Split the text by lines
    const Lines = text.split(/\r?\n/);

    for (const Line of Lines) {

        //Delete empty spaces
        const CleanLine = Line.trim();

        //Ignore empty lines and comments
        if (CleanLine === "" ||CleanLine.startsWith("#"))
            continue;

        //Get the first = in the line(separates the key from the text)
        const Separator = CleanLine.indexOf("=");

        //Sanity check in case of invalid line(no =)
        if (Separator === -1)
            continue;

        //Extract the key
        const Key = CleanLine.slice(0, Separator).trim();
        //Extract the text
        const Content = CleanLine.slice(Separator + 1).trim();

        //Store the loaded text
        Text[Key] = Content;
    }

    return Text;
}

function ApplyTranslations(Text) {

    //Search all elements with data-i18n
    const Elements = document.querySelectorAll("[data-i18n]");

    //Traverse all the elements
    for (const Element of Elements) {

        //Get the key of the data-i18n
        const Key = Element.dataset.i18n;

        //Check for the translation to that key and change the text
        if (Text[Key] !== undefined)
            Element.textContent = Text[Key];
    }
}

async function InitI18n() {

    //The first time either load the stored language or if it doesn't exist the default one
    const SavedLanguage = localStorage.getItem("language") || document.getElementById("Language").dataset.url;
    await LoadLanguage(SavedLanguage);
    document.dispatchEvent(new Event("TextLoaded"));
}

//Add an Event so that the function is called when the components are loaded
document.addEventListener("ComponentsLoaded",InitI18n,{ once: true });