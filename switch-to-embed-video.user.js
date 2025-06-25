// ==UserScript==
// @name         switch-to-embed-video
// @namespace    http://tampermonkey.net/
// @version      0.1
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

"use strict";
if (window.hasRunMyScript) return;
window.hasRunMyScript = true;
let listenersAttached = false;

runWhenReady("#menu > ytd-menu-renderer.style-scope.ytd-watch-metadata")
runOnFound("tp-yt-paper-dialog.style-scope")

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

    let videoElement = videoContainer.querySelector('.video-stream')
    videoElement.pause()
    videoElement.currentTime = 37800;
    videoElement.setAttribute('display', 'none')

    createNewIframe(videoId, videoContainer);
    console.log('New iframe created.')
    addEventListeners(videoElement)
}

function createNewIframe(videoId, parent) {
    const newElement = document.createElement('iframe')
    newElement.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1'
    newElement.style.width = '100%'
    newElement.style.height = '77vh'
    newElement.className = 'newIframeFromEmbed'
    parent.prepend(newElement)
}


function addEventListeners(videoElement) {
    let iframeElement = document.querySelector(".newIframeFromEmbed")
    iframeElement.addEventListener('load', function () {
        let moviePlayer = this.contentWindow.document.querySelector("#movie_player")
        if(!moviePlayer ) return
        moviePlayer.focus()
    });

    if (listenersAttached) return;
    listenersAttached = true;

    videoElement.addEventListener('playing', () => {
         videoElement.pause();
    });

    window.addEventListener('mousedown', function (e) {
        let newVideo = e.target.closest('ytd-compact-video-renderer.style-scope');
        let redirect = e.target.closest('#endpoint');
        let searchButton = e.target.closest('.ytSearchboxComponentSearchButton')
        if (!newVideo && !redirect && !searchButton) return

        let iframe = document.querySelector('.newIframeFromEmbed')
        if(!iframe) return
        iframe.remove();
    });

    window.addEventListener('popstate', function (event) {
        let iframe = document.querySelector('.newIframeFromEmbed')
        if(!iframe) return
        iframe.remove();
    });

    window.addEventListener('keydown', function onEvent(e) {
        if (e.keyCode === 13) {
            let iframe = document.querySelector('.newIframeFromEmbed')
            if(!iframe) return
            iframe.remove();
        }
    }, true);
}

function runWhenReady(readySelector) {
    let numAttempts = 0;
    let tryNow = function () {
        let elem = document.querySelector(readySelector);
        if (elem && !document.querySelector('.newSwitchButton')) {
            createNewButton(elem);
            let error = document.querySelector('#error-screen');
            if (error) error.remove();
        } else {
            numAttempts++;
            if (numAttempts >= 34) {
                console.warn('Giving up after 34 attempts. Could not find: ' + readySelector);
            } else {
                setTimeout(tryNow, 250 * Math.pow(1.1, numAttempts));
            }
        }
    };
    tryNow();
}

function runOnFound(selector) {
    const observer = new MutationObserver((mutationsList) => {
        const callback = (mutationList) => {
        for (const mutation of mutationList) {
            document.querySelectorAll(selector).forEach(e => e.remove())
        }
    };})
    observer.observe(document.body, { childList: true, subtree: true });
}
