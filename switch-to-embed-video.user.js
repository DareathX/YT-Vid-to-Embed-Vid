// ==UserScript==
// @name         switch-to-embed-video
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Stop youtube
// @author       DareathX
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @updateURL    https://raw.githubusercontent.com/DareathX/YT-Vid-to-Embed-Vid/main/switch-to-embed-video.user.js
// @downloadURL  https://raw.githubusercontent.com/DareathX/YT-Vid-to-Embed-Vid/main/switch-to-embed-video.user.js
// @grant        none
// @noframes
// @exclude      https://www.youtube.com/embed/*
// ==/UserScript==

(function() {
    'use strict';
    if (window.hasRunMyScript) return;
    window.hasRunMyScript = true;
    let listenersAttached = false;
    let switchButtonFound = false;

    runOnFound('#menu > ytd-menu-renderer.style-scope.ytd-watch-metadata')

    function createNewButton(element) {
        const newElement = document.createElement('button')
        newElement.textContent = "Switch"
        newElement.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading newSwitchButton'
        newElement.style.marginRight = "7px"
        newElement.style.padding = "0px 20px 0px 20px"
        newElement.style.maxWidth = "65px"
        newElement.style.minWidth = "65px"
        newElement.onclick = function () {replacePlayerWithEmbed();};
        element.prepend(newElement)
    }

    function replacePlayerWithEmbed() {
        let iframe = document.querySelector('.newIframeFromEmbed')
        if (iframe) iframe.remove();
        let videoContainer = document.querySelector('#ytd-player > div:nth-child(1)')
        let videoId = document.querySelector('ytd-watch-flexy.style-scope').getAttribute('video-id')

        let movieElement = videoContainer.querySelector('#movie_player')
        if (movieElement) {
            movieElement.style.display = 'none'
            movieElement.style.position = 'relative';
            movieElement.pauseVideo();
        }

        createNewIframe(videoId, videoContainer);
        console.log('New iframe created.')
        addEventListeners(movieElement)
    }

    function createNewIframe(videoId, parent) {
        const newElement = document.createElement('iframe')
        newElement.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1'
        newElement.style.width = '100%'
        newElement.style.height = '100%'
        newElement.style.position = 'absolute';
        newElement.className = 'newIframeFromEmbed'
        newElement.referrerPolicy = 'origin'
        parent.prepend(newElement)
    }

    function addEventListeners(movieElement) {
        let iframeElement = document.querySelector(".newIframeFromEmbed")
        if (iframeElement) iframeElement.addEventListener('load', loadHandler)

        if (listenersAttached) return;
        listenersAttached = true;
        movieElement._playingHandler = function() { playingHandler(movieElement);};
        movieElement.addEventListener('onStateChange', movieElement._playingHandler);

        window.addEventListener('mousedown', mousedownHandler);
        window.addEventListener('popstate', popstateHandler);
        window.addEventListener('keydown', keydownHandler, true);
    }

    function loadHandler() {
        let moviePlayer = this.contentWindow.document.querySelector("#movie_player")
        if(!moviePlayer ) return
        moviePlayer.focus()
    }

    function playingHandler(movieElement) {
        if (movieElement.getPlayerState() != 2) movieElement.pauseVideo()
    }

    function mousedownHandler(e) {
        let newVideo = e.target.closest('ytd-compact-video-renderer.style-scope.ytd-item-section-renderer');
        let newPlaylist = e.target.closest('yt-lockup-view-model.ytd-item-section-renderer.lockup')
        let redirect = e.target.closest('#endpoint');
        let playlist = e.target.closest('#wc-endpoint')
        let searchButton = e.target.closest('.ytSearchboxComponentSearchButton')
        if (newVideo || newPlaylist || redirect || playlist || searchButton) {
            removeIframe('mousedown', mousedownHandler)
            return
        }

        let timestampUrl = e.target.closest('.yt-core-attributed-string__link.yt-core-attributed-string__link--call-to-action-color')
        if (!timestampUrl) return
        timestampUrl = timestampUrl.href
        if (!timestampUrl.includes('/watch?v=')) return

        const params = timestampUrl.split(/[?&]/);
        const videoId = params.find(p => p.startsWith('v=')).split('=')[1];
        const time = ((params.find(p => p.startsWith('t=')) || "").split('=')[1] || "").replace('s', '');

        let embed = document.querySelector('.newIframeFromEmbed')
        if (time) {
            embed.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${time}`
        } else
        {
            embed.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=0`
        }
    }

    function popstateHandler() {
        removeIframe('popstate', popstateHandler)
    }

    function keydownHandler(e) {
        if (e.keyCode !== 13) return
        removeIframe('keydown', keydownHandler, true)
    }

    function removeIframe(listener, func, bool = false) {
        let iframe = document.querySelector('.newIframeFromEmbed')
        if(!iframe) return
        window.removeEventListener(listener, func, bool);
        iframe.removeEventListener('load', loadHandler)

        let movieElement = document.querySelector('#ytd-player > div:nth-child(1) > #movie_player')
        movieElement.style.display = ""
        movieElement.removeEventListener('onStateChange', movieElement._playingHandler);
        delete movieElement._playingHandler;

        listenersAttached = false
        iframe.remove();
    }

    function runOnFound(selector) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                const elem = document.querySelector(selector)
                if (elem && !switchButtonFound) {
                    observer.disconnect();
                    switchButtonFound = true;
                    createNewButton(elem);
                }
            }});

        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
