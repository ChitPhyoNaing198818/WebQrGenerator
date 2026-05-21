/**
 * Universal Audio Helper
 * Intercepts HTML5 <audio> element control flow to provide native support for YouTube and YouTube Music URLs
 * using a transparent Proxy, while maintaining backwards compatibility with standard MP3/WAV links.
 */
(function() {
    // Loader for YouTube iframe API
    if (!window.YT && !document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            document.head.appendChild(tag);
        }
    }

    const playerCache = {};

    function getYouTubeId(url) {
        if (!url || typeof url !== 'string') return null;
        // Supports youtube.com, youtu.be, music.youtube.com, embed URLs, and watch patterns
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|music\.youtube\.com\/watch\?v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    class YoutubeAudioAdapter {
        constructor(nativeAudio) {
            this.native = nativeAudio;
            this.isPlaying = false;
            this.isYtReady = false;
            this.pendingPlay = false;
            this._src = '';
            this.ytPlayer = null;

            // Create a completely hidden container for YouTube player
            this.ytContainer = document.createElement('div');
            this.ytContainer.id = (nativeAudio.id || 'gen-audio-' + Math.random().toString(36).substr(2, 9)) + '-yt-container';
            this.ytContainer.style.position = 'fixed';
            this.ytContainer.style.width = '1px';
            this.ytContainer.style.height = '1px';
            this.ytContainer.style.left = '-100px';
            this.ytContainer.style.top = '-100px';
            this.ytContainer.style.opacity = '0';
            this.ytContainer.style.pointerEvents = 'none';
            document.body.appendChild(this.ytContainer);
        }

        get src() {
            return this._src;
        }

        set src(value) {
            if (this._src === value) return;
            this._src = value;
            const ytId = getYouTubeId(value);
            if (ytId) {
                // Pause native playback
                this.native.pause();
                this.loadYT(ytId);
            } else {
                // Clean up YouTube if operating standard audio
                if (this.ytPlayer) {
                    try { this.ytPlayer.stopVideo(); } catch(e) {}
                    this.ytContainer.innerHTML = '';
                    this.ytPlayer = null;
                }
                this.isYtReady = false;
                
                // Route stream to native audio
                this.native.src = value;
                const srcEl = this.native.querySelector('source');
                if (srcEl) srcEl.src = value;
                
                try {
                    this.native.load();
                } catch(e) {
                    console.log("Native load deferred:", e);
                }

                if (this.isPlaying) {
                    this.native.play().catch(e => console.log("Native autoplay retry:", e));
                }
            }
        }

        loadYT(videoId) {
            this.isYtReady = false;
            this.ytContainer.innerHTML = `<div id="${this.ytContainer.id}-player"></div>`;
            
            const init = () => {
                this.ytPlayer = new YT.Player(this.ytContainer.id + '-player', {
                    height: '1',
                    width: '1',
                    videoId: videoId,
                    playerVars: {
                        autoplay: this.isPlaying ? 1 : 0,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        loop: 1,
                        playlist: videoId
                    },
                    events: {
                        onReady: (event) => {
                            this.isYtReady = true;
                            if (this.isPlaying || this.pendingPlay) {
                                event.target.playVideo();
                                this.pendingPlay = false;
                            }
                        },
                        onStateChange: (event) => {
                            if (event.data === 0) { // ENDED
                                event.target.playVideo(); // Loop
                            }
                        }
                    }
                });
            };

            if (window.YT && window.YT.Player) {
                init();
            } else {
                const interval = setInterval(() => {
                    if (window.YT && window.YT.Player) {
                        clearInterval(interval);
                        init();
                    }
                }, 100);
            }
        }

        play() {
            this.isPlaying = true;
            const ytId = getYouTubeId(this._src);
            if (ytId) {
                if (this.isYtReady && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
                    this.ytPlayer.playVideo();
                } else {
                    this.pendingPlay = true;
                }
                return Promise.resolve();
            } else {
                return this.native.play();
            }
        }

        pause() {
            this.isPlaying = false;
            this.pendingPlay = false;
            const ytId = getYouTubeId(this._src);
            if (ytId) {
                if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
                    this.ytPlayer.pauseVideo();
                }
            } else {
                this.native.pause();
            }
        }

        load() {
            const ytId = getYouTubeId(this._src);
            if (!ytId) {
                this.native.load();
            }
        }

        get paused() {
            const ytId = getYouTubeId(this._src);
            if (ytId) {
                return !this.isPlaying;
            }
            return this.native.paused;
        }
    }

    function createProxy(nativeAudio) {
        if (!nativeAudio) return null;
        if (nativeAudio.__isProxy) return nativeAudio;

        const adapter = new YoutubeAudioAdapter(nativeAudio);

        const proxy = new Proxy(nativeAudio, {
            get(target, prop, receiver) {
                if (prop === '__isProxy') return true;
                if (prop === '_adapter') return adapter;
                
                // Intercept properties
                if (prop === 'src') return adapter.src || target.src;
                if (prop === 'play') return () => adapter.play();
                if (prop === 'pause') return () => adapter.pause();
                if (prop === 'load') return () => adapter.load();
                if (prop === 'paused') return adapter.paused;

                // Handle standard function binding (so event listeners, class list methods etc work)
                const val = Reflect.get(target, prop, receiver);
                return typeof val === 'function' ? val.bind(target) : val;
            },
            set(target, prop, val, receiver) {
                if (prop === 'src') {
                    adapter.src = val;
                    return true;
                }
                return Reflect.set(target, prop, val, receiver);
            }
        });

        // Set initial src from element attributes if any
        const srcAttr = nativeAudio.getAttribute('src');
        const sourceEl = nativeAudio.querySelector('source');
        const initialSrc = srcAttr || (sourceEl ? sourceEl.getAttribute('src') : '');
        if (initialSrc) {
            adapter.src = initialSrc;
        }

        return proxy;
    }

    // Capture standard document methods
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        const el = originalGetElementById.call(document, id);
        if (el && el.tagName === 'AUDIO') {
            if (!playerCache[id]) {
                playerCache[id] = createProxy(el);
            }
            return playerCache[id];
        }
        return el;
    };

    const originalQuerySelector = document.querySelector;
    document.querySelector = function(selector) {
        const el = originalQuerySelector.call(document, selector);
        if (el && el.tagName === 'AUDIO') {
            const id = el.id || 'query-audio-' + Math.random().toString(36).substr(2, 9);
            if (!playerCache[id]) {
                playerCache[id] = createProxy(el);
            }
            return playerCache[id];
        }
        return el;
    };
})();
