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

    //Script location (must be read synchronously, before any await).
    //With type="module" currentScript is null, so it falls back to the page URL.
    const SCRIPT_URL = ( document.currentScript && document.currentScript.src )
                       ? document.currentScript.src
                       : window.location.href;

    //Configuration
    const CONFIG = {

        //Relative to Transition.js, not to the HTML page
        logoPath            : new URL( "../Assets/portfolio-logo.svg", SCRIPT_URL ).href,

        holdAfterLogoMs     : 220,         //Pause after finishing the logo
        minimumVisibleMs    : 650,         //Initial transition minimun time
        resourceTimeoutMs   : 10000,       //Maximun waiting time per resource
        maxWaitMs           : 6000,        //Max wait for the whole page content
        hardTimeoutMs       : 12000,       //Failsafe: force the page to show

        drawPathMs          : 500,         //Duration of each stroke
        drawStaggerMs       : 150,         //Delay between strokes
        loopPauseMs         : 250,         //Pause between logo repetitions

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

            const response = await fetch( CONFIG.logoPath );


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

            console.warn( "Transition.js: Logo couldn't be loaded", CONFIG.logoPath, error );
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

        const paths = [ "M190 30 L368 209 L207 370 L30 191 Z",
                        "M113 108 L290 287",
                        "M123 285 L205 201",
                        "M30 191 L368 209" ];


        paths.forEach(d => {

            const path = document.createElementNS( NS, "path" );
            path.setAttribute( "d", d );
            svg.appendChild(path);
        });

        return svg;
    }

    function pathLength(path) {

        try {

            return path.getTotalLength();
        }
        catch {

            return 2000;
        }
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

        resetLogo();
    }

    //Reset logo to its original state (hidden stroke)
    function resetLogo() {

        state.paths.forEach(path => {

            path.getAnimations().forEach( anim => anim.cancel() );

            const length = pathLength(path);

            path.style.strokeDasharray  = `${length}`;
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

    //Draw the logo (Web Animations API, independent from the CSS classes)
    async function drawLogo() {

        if (!state.paths.length)
            return;

        resetLogo();

        if (reducedMotion()) {

            state.paths.forEach( path => path.style.strokeDashoffset = "0" );
            return;
        }

        await nextFrame();

        const animations = [];

        for ( const path of state.paths ) {

            const length = pathLength(path);

            animations.push( path.animate(

                [ { strokeDashoffset: length }, { strokeDashoffset: 0 } ],
                { duration: CONFIG.drawPathMs, easing: "ease-in-out", fill: "forwards" }
            ));

            await sleep( CONFIG.drawStaggerMs );
        }

        //Wait for the last stroke to finish
        await Promise.all( animations.map( a => a.finished.catch( () => {} ) ) );
    }

    //Wait for the images to load
    function waitForImages() {

        //Lazy images may never load while off-screen, so they are ignored
        const images = [ ...document.images ].filter( img => img.loading !== "lazy" );

        if (!images.length)
            return Promise.resolve();

        return Promise.all( images.map(img => {

                if ( img.complete )
                    return Promise.resolve();

                return new Promise(resolve => {

                    const done = () => resolve();

                    img.addEventListener( "load", done, { once: true } );
                    img.addEventListener( "error", done, { once: true } );

                    setTimeout( done, CONFIG.resourceTimeoutMs );
                });
            })
        );
    }

    //Wait for the videos to load
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

    //Prepare the new page (with a global cap so it can never hang)
    async function prepareCurrentPage() {

        await Promise.race([

            Promise.all([ waitForImages(),
                          waitForVideos(),
                          waitForFonts(),
                          waitForTextLoaded() ]),

            sleep( CONFIG.maxWaitMs )
        ]);

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

    //Failsafe: always show the page
    function forceReveal() {

        if (state.leaving)
            return;

        const root = document.documentElement;

        root.classList.add( "page-ready" );
        root.classList.remove( "page-loading", "page-leaving" );

        if (state.overlay)
            state.overlay.classList.add( "is-hidden" );
    }

    //Start the transition
    async function startInitialTransition() {

        state.startedAt = performance.now();

        //Create the initial overlay and show it
        await createOverlay();
        showOverlayImmediately();

        //Load the content in parallel
        const loading = prepareCurrentPage();

        //Repeat the logo until everything is loaded and the minimum time has
        //passed. The current cycle always finishes, so the logo is never cut.
        while (true) {

            await drawLogo();

            await sleep( CONFIG.holdAfterLogoMs );

            const minimumReached = ( performance.now() - state.startedAt )
                                   >= CONFIG.minimumVisibleMs;

            if ( state.ready && minimumReached )
                break;

            await sleep( CONFIG.loopPauseMs );
        }

        await loading;

        //Finish by showing the page
        await hideOverlay();
    }

    async function navigateWithTransition(url) {

        if (state.leaving)
            return;

        state.leaving = true;

        try {

            await createOverlay();

            showOverlayImmediately();

            await drawLogo();

            await sleep( CONFIG.holdAfterLogoMs );
        }
        catch (error) {

            console.error( "Transition.js: leaving transition failed", error );
        }

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

        //Last resort if anything gets stuck
        setTimeout( forceReveal, CONFIG.hardTimeoutMs );

        installNavigation();

        try {

            if (reducedMotion()) {

                await createOverlay();

                await prepareCurrentPage();

                forceReveal();

                return;
            }

            await startInitialTransition();
        }
        catch (error) {

            console.error( "Transition.js: transition failed", error );

            forceReveal();
        }
    }

    //Entry point
    if ( document.readyState === "loading" )

        document.addEventListener( "DOMContentLoaded", boot, { once: true } );
    else
        boot();

})();