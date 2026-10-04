/**
 * @file Transition.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Transition from page to page
 * @date 2026-09-29
 *
 * @copyright Copyright (c) 2026
 *
 */
(() => { "use strict";

    //Configuration
    const CONFIG = {

        logoPath            : "../Assets/portfolio-logo.svg",
        holdAfterLogoMs     : 220,         //Pause after finishing the logo
        minimumVisibleMs    : 650,         //Initial transition minimun time
        resourceTimeoutMs   : 10000,       //Maximun waiting time
        textLoadedEvent     : "TextLoaded",//Text loaded event
        internalLinkSelector: "a[href]"    //Internal links
    };

    //State
    const state = {

        startedAt : performance.now(),
        overlay   : null,
        svg       : null,
        paths     : [],
        leaving   : false,
        textLoaded: false,
        ready     : false
    };

    function sleep(ms) {

        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    function nextFrame() {

        return new Promise(resolve => {

            requestAnimationFrame(() => {

                requestAnimationFrame(resolve);

            });

        });
    }

    function reducedMotion() {

        return ( window.matchMedia &&
                 window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches );
    }

    //Modified click
    function isModifiedClick(event) {

        return ( event.button !== 0 ||
                 event.metaKey ||
                 event.ctrlKey ||
                 event.shiftKey ||
                 event.altKey );
    }

    function isInternalLink(anchor) {

        if (!anchor)
            return false;

        if (!anchor.href)
            return false;

        //Don't display if is a download
        if ( anchor.hasAttribute("download") )
            return false;

        //Don't display if has blank label
        if ( anchor.target && anchor.target !== "_self" )
            return false;

        let url;

        try {

            url = new URL( anchor.href, window.location.href );
        }
        catch {

            return false;
        }

        //Only if is in the same domain
        if ( url.origin !== window.location.origin )
            return false;

        //Only HTTP/HTTPS
        if ( url.protocol !== window.location.protocol )
            return false;

        //Ignore if is in the same page
        if ( url.pathname === window.location.pathname &&
             url.search === window.location.search &&
             url.hash )
            return false;


        const path = url.pathname.toLowerCase();


        return ( path.endsWith(".html") ||
                 path.endsWith("/") );
    }

    //Load the Logo
    async function loadLogoSvg() {

        try {

            const response = await fetch( CONFIG.logoPath,
                                          { cache: "force-cache" } );


            if (!response.ok)
                throw new Error( `Transition.js: Logo HTTP ${response.status}` );

            const text = await response.text();

            const wrapper = document.createElement("div");

            wrapper.innerHTML = text.trim();

            const svg = wrapper.querySelector("svg");


            if (!svg)
                throw new Error( "Transition.js: SVG not found" );


            svg.classList.add( "page-transition__logo" );


            svg.setAttribute( "aria-hidden", "true" );

            return svg;
        }
        catch (error) {

            console.warn( "Transition.js: Logo couldn't be loaded", error );
            return createFallbackSvg();
        }
    }

    //Create default logo(in case mine could not be loaded)
    function createFallbackSvg() {

        const NS = "http://www.w3.org/2000/svg";

        const svg = document.createElementNS( NS, "svg" );

        svg.setAttribute("viewBox", "0 0 400 400" );

        svg.classList.add( "page-transition__logo" );

        svg.setAttribute( "aria-hidden", "true" );

        const paths = [ "M200 40 L362 202 L232 370 L32 170 Z",
                        "M117 125 L200 208 L278 286",
                        "M137 270 L200 208",
                        "M32 170 L362 202" ];


        paths.forEach(d => {

            const path = document.createElementNS( NS, "path" );
            path.setAttribute( "d", d );
            svg.appendChild(path);
        });

        return svg;
    }

    //Create the overlay
    async function createOverlay() {

        if (state.overlay)
            return;

        const overlay = document.createElement("div");
        overlay.className = "page-transition";
        overlay.setAttribute( "aria-hidden", "true" );

        document.body.appendChild( overlay );
        state.overlay = overlay;

        //Load the logo
        const svg = await loadLogoSvg();
        overlay.appendChild(svg);

        state.svg = svg;
        state.paths = [ ...svg.querySelectorAll("path") ];

        state.paths.forEach(path => {

            let length;

            try {

                length = path.getTotalLength();
            }
            catch {

                length = 2000;
            }


            path.style.strokeDasharray = `${length}`;

            path.style.strokeDashoffset = `${length}`;
        });
    }

    //Reset logo to its original state
    function resetLogo() {

        state.paths.forEach(path => {

            let length;

            try {

                length = path.getTotalLength();

            }
            catch {

                length = 2000;
            }


            path.classList.remove( "is-drawing", "is-complete" );


            path.style.strokeDasharray = `${length}`;
            path.style.strokeDashoffset = `${length}`;
        });
    }

    //Display overlay
    function showOverlayImmediately() {

        if (!state.overlay)
            return;

        state.overlay.classList.remove("is-hidden");

        //Block controls and scroll
        document.documentElement.classList.add( "page-leaving" );
        document.documentElement.classList.remove( "page-ready" );
    }

    //Draw the logo
    async function drawLogo() {

        if (!state.paths.length)
            return;

        resetLogo();

        if (reducedMotion()) {

            state.paths.forEach(path => {

                path.classList.add( "is-complete" );


                path.style.strokeDashoffset = "0";
            });

            return;
        }

        //Draw overlay
        await nextFrame();

        for ( const path of state.paths ) {

            path.classList.add( "is-drawing" );

            void path.getBoundingClientRect();

            await nextFrame();

            path.classList.add( "is-complete" );
            await sleep(100);
        }

        await sleep(200);

        state.paths.forEach(path => {

            path.classList.remove( "is-drawing" );

        });
    }

    //Wait for the images to load
    function waitForImages() {

        const images = [ ...document.images ];

        if (!images.length)
            return Promise.resolve();

        return Promise.all( images.map(img => {

                if ( img.complete )
                    return Promise.resolve();

                return new Promise(resolve => {

                    const done = () => resolve();

                    img.addEventListener( "load", done, { once: true } );
                    img.addEventListener( "error", done, { once: true } );
                });
            })
        );
    }

    //Wait for the images to load
    function waitForVideos() {

        const videos = [ ...document.querySelectorAll( "video" ) ];

        if (!videos.length)
            return Promise.resolve();

        return Promise.all( videos.map(video => {

                if ( video.readyState >= 1 )
                    return Promise.resolve();

                return new Promise(resolve => {

                    const done = () => resolve();

                    video.addEventListener( "loadedmetadata", done, { once: true } );
                    video.addEventListener( "error", done, { once: true } );

                    setTimeout( done, CONFIG.resourceTimeoutMs );
                });
            })
        );
    }

    //Wait for the fonts to load
    function waitForFonts() {

        if ( !document.fonts || !document.fonts.ready )
            return Promise.resolve();

        return Promise.race([ document.fonts.ready,
                              sleep(CONFIG.resourceTimeoutMs ) ]);
    }

    //Wait for the text to load
    function waitForTextLoaded() {

        if ( state.textLoaded || window.__TEXT_LOADED__ === true ) {

            state.textLoaded = true;

            return Promise.resolve();
        }


        return new Promise(resolve => {

            const timeout = setTimeout(() => {

                    console.warn( "[Transition] TextLoaded timeout." );

                    resolve();

                }, CONFIG.resourceTimeoutMs);


            document.addEventListener( CONFIG.textLoadedEvent, () => {

                    clearTimeout(timeout);


                    state.textLoaded = true;

                    window.__TEXT_LOADED__ = true;

                    resolve();
                }, { once: true } );
        });
    }

    //Prepare the new page
    async function prepareCurrentPage() {

        await Promise.all([ waitForImages(),
                            waitForVideos(),
                            waitForFonts(),
                            waitForTextLoaded() ]);

        state.ready = true;
    }

    //Hide the overlay
    async function hideOverlay() {

        if (!state.overlay)
            return;

        document.documentElement.classList.add( "page-ready" );
        document.documentElement.classList.remove( "page-loading" );

        await nextFrame();

        state.overlay.classList.add( "is-hidden" );

        document.dispatchEvent(new Event("OverlayHide"));

        //Wait for the fade to finish
        await sleep(50);

        document.documentElement.classList.remove( "page-leaving" );
    }

    //Start the transition
    async function startInitialTransition() {

        state.startedAt = performance.now();

        //Create the initial overlay and show it
        await createOverlay();
        showOverlayImmediately();

        //Draw the logo
        await drawLogo();

        //Wait for everything to load
        await prepareCurrentPage();

        //Minimun wait
        const elapsed = performance.now() - state.startedAt;
        const remaining = Math.max( 0, CONFIG.minimumVisibleMs - elapsed );


        if (remaining > 0)
            await sleep( remaining );

        await sleep( CONFIG.holdAfterLogoMs );

        //Finish by showing the page
        await hideOverlay();
    }

    async function navigateWithTransition(url) {

        if (state.leaving)
            return;

        state.leaving = true;

        showOverlayImmediately();

        await drawLogo();

        await sleep( CONFIG.holdAfterLogoMs );

        window.location.assign( url );
    }

    function installNavigation() {

        document.addEventListener( "click",

            event => {

                if ( isModifiedClick(event) )
                    return;


                const anchor = event.target.closest( CONFIG.internalLinkSelector );

                if (!anchor)
                    return;

                if ( !isInternalLink(anchor) )
                    return;

                event.preventDefault();

                const url = new URL( anchor.href, window.location.href );

                navigateWithTransition( url.href );
            }, true );
    }

    document.addEventListener( CONFIG.textLoadedEvent, () => {

            state.textLoaded = true;
            window.__TEXT_LOADED__ = true;
        });


    //Restore page when going backwards
    function restoreFromCache() {

        state.leaving = false;
        resetLogo();


        const root = document.documentElement;

        root.classList.remove( "page-loading", "page-leaving" );
        root.classList.add( "page-ready" );


        if (state.overlay)
            state.overlay.classList.add( "is-hidden" );
    }


    window.addEventListener( "pageshow", event => {

            if (event.persisted)
                restoreFromCache();
        }
    );
    window.PortfolioTransition = {

        ready() {

            state.textLoaded = true;
            window.__TEXT_LOADED__ = true;
        },


        go(url) {

            navigateWithTransition( url );
        }
    };

    //Start everything
    async function boot() {

        //Page blocked
        document.documentElement.classList.add( "page-loading" );

        installNavigation();

        if (reducedMotion()) {

            await createOverlay();

            await prepareCurrentPage();

            document.documentElement.classList.add( "page-ready" );
            document.documentElement.classList.remove( "page-loading" );
            state.overlay.classList.add( "is-hidden" );

            return;
        }

        await startInitialTransition();
    }

    //Entry point
    if ( document.readyState === "loading" )

        document.addEventListener( "DOMContentLoaded", boot, { once: true } );
    else
        boot();

})();