/**
 * Surprise Extras Helper v1.0
 * Handles Surprise Release Countdown Lock and Google's interactive 3D AR Model Viewer.
 */
(function() {
    // 1. Dynamic Dependency Injection
    if (!document.getElementById('model-viewer-script')) {
        const script = document.createElement('script');
        script.id = 'model-viewer-script';
        script.type = 'module';
        script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
        document.head.appendChild(script);
    }

    if (!document.getElementById('font-awesome-cdn')) {
        const link = document.createElement('link');
        link.id = 'font-awesome-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
    }

    // Ensure we have a style block for fade-in animations
    if (!document.getElementById('surprise-extra-styles')) {
        const style = document.createElement('style');
        style.id = 'surprise-extra-styles';
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
        `;
        document.head.appendChild(style);
    }

    let countdownInterval = null;
    let lastProcessedData = null;

    // Window message listener for parent Customize Studio live-sync feeds
    window.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_DATA') {
            handleSurpriseExtra(event.data.payload);
        }
    });

    // Auto-load on view route (if database record exists in URL params)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
        fetch(`/api/card/${urlParams.get('id')}`)
            .then(r => r.json())
            .then(d => handleSurpriseExtra(d))
            .catch(err => console.error("Error loading surprise extra:", err));
    }

    function handleSurpriseExtra(data) {
        if (!data) return;
        lastProcessedData = data;

        // A. Handle Surprise Locked Release Timer
        handleCountdownLock(data);

        // B. Handle AR 3D Model Rendering
        handleARModelViewer(data);
    }

    function handleCountdownLock(data) {
        const lockTimeStr = data.lock_datetime;
        const lockMsg = data.lock_message || "This surprise is locked until the countdown reaches zero! 🤫🎁";

        if (lockTimeStr) {
            const lockTime = new Date(lockTimeStr).getTime();
            const now = Date.now();

            if (lockTime > now) {
                let overlay = document.getElementById('surprise-lock-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'surprise-lock-overlay';
                    overlay.className = 'fixed inset-0 z-[999999] flex flex-col items-center justify-center p-6 text-center transition-all duration-1000';
                    overlay.style.background = 'radial-gradient(circle at center, #0f172a, #020617)';
                    
                    overlay.innerHTML = `
                        <!-- Ambient Glow -->
                        <div class="absolute inset-x-0 top-1/4 -translate-y-1/2 flex justify-center pointer-events-none">
                            <div class="w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                        </div>
                        
                        <div class="max-w-md w-full space-y-8 relative z-10 animate-fade-in">
                            <!-- Lock Icon Group -->
                            <div class="flex justify-center">
                                <div class="relative w-20 h-20 rounded-3xl bg-slate-900 border border-slate-850 flex items-center justify-center text-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.15)] animate-bounce duration-[3s]">
                                    <i class="fa-solid fa-lock text-3xl"></i>
                                    <span class="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                                        <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-550"></span>
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Lock Message -->
                            <div class="space-y-3">
                                <h2 class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Lock Release Countdown</h2>
                                <p id="lock-msg-text" class="text-sm font-semibold text-slate-300 leading-relaxed px-4"></p>
                            </div>
                            
                            <!-- Premium Countdown Grid -->
                            <div class="grid grid-cols-4 gap-3 select-none font-mono">
                                <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-inner">
                                    <span id="cd-days" class="block text-2xl md:text-3xl font-black text-rose-500 tracking-tight">00</span>
                                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Days</span>
                                </div>
                                <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-inner">
                                    <span id="cd-hours" class="block text-2xl md:text-3xl font-black text-rose-500 tracking-tight">00</span>
                                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Hrs</span>
                                </div>
                                <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-inner">
                                    <span id="cd-mins" class="block text-2xl md:text-3xl font-black text-rose-500 tracking-tight">00</span>
                                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Mins</span>
                                </div>
                                <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-inner">
                                    <span id="cd-secs" class="block text-2xl md:text-3xl font-black text-amber-500 tracking-tight animate-pulse">00</span>
                                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Secs</span>
                                </div>
                            </div>
                            
                            <!-- Floating status -->
                            <div class="flex justify-center gap-1.5 pt-4">
                                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-ping"></span>
                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500/50 animate-pulse"></span>
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-bounce"></span>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(overlay);
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.overflow = 'hidden';
                }

                const msgEl = document.getElementById('lock-msg-text');
                if (msgEl) msgEl.innerText = lockMsg;

                if (countdownInterval) clearInterval(countdownInterval);

                const updateTicker = () => {
                    const nowMs = Date.now();
                    const diff = lockTime - nowMs;

                    if (diff <= 0) {
                        clearInterval(countdownInterval);
                        revealSurprise();
                        return;
                    }

                    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);

                    const daysEl = document.getElementById('cd-days');
                    const hoursEl = document.getElementById('cd-hours');
                    const minsEl = document.getElementById('cd-mins');
                    const secsEl = document.getElementById('cd-secs');

                    if (daysEl) daysEl.innerText = String(d).padStart(2, '0');
                    if (hoursEl) hoursEl.innerText = String(h).padStart(2, '0');
                    if (minsEl) minsEl.innerText = String(m).padStart(2, '0');
                    if (secsEl) secsEl.innerText = String(s).padStart(2, '0');
                };

                updateTicker();
                countdownInterval = setInterval(updateTicker, 1000);
                return;
            }
        }

        revealSurprise(false);
    }

    function revealSurprise(animate = true) {
        if (countdownInterval) clearInterval(countdownInterval);
        const overlay = document.getElementById('surprise-lock-overlay');

        if (overlay) {
            if (animate) {
                overlay.classList.add('opacity-0', 'scale-110', 'pointer-events-none');
                
                // Play particle explosion celebration if template has confetti support
                if (window.confetti) {
                    window.confetti({ particleCount: 150, spread: 85, origin: { y: 0.6 } });
                }

                setTimeout(() => {
                    overlay.remove();
                    document.documentElement.style.overflow = '';
                    document.body.style.overflow = '';
                }, 1000);
            } else {
                overlay.remove();
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
            }
        }
    }

    function handleARModelViewer(data) {
        const isArEnabled = data.ar_enabled === 'yes';
        const glbUrl = data.ar_model_glb || 'https://modelviewer.dev/shared-assets/models/Cake.glb';

        let arBtn = document.getElementById('floating-ar-toggle');
        let arModal = document.getElementById('ar-viewer-modal');

        if (!isArEnabled) {
            if (arBtn) arBtn.remove();
            if (arModal) arModal.remove();
            return;
        }

        // A. Expandable floating widget triggers
        if (!arBtn) {
            arBtn = document.createElement('button');
            arBtn.id = 'floating-ar-toggle';
            arBtn.className = 'fixed bottom-4 left-4 z-[9999] w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all hover:scale-110 active:scale-95 animate-pulse cursor-pointer';
            arBtn.innerHTML = '<i class="fa-solid fa-cube text-xl"></i>';

            arBtn.addEventListener('click', () => {
                const modal = document.getElementById('ar-viewer-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    setTimeout(() => {
                        modal.classList.remove('opacity-0');
                        modal.querySelector('.modal-container').classList.remove('scale-95');
                    }, 10);
                }
            });
            document.body.appendChild(arBtn);
        }

        // B. Absolute fullscreen 3D view modal popup
        if (!arModal) {
            arModal = document.createElement('div');
            arModal.id = 'ar-viewer-modal';
            arModal.className = 'fixed inset-0 z-[99999] hidden items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 opacity-0';
            arModal.innerHTML = `
                <div class="modal-container w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative transition-transform duration-300 scale-95 flex flex-col h-[480px]">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/45">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-cubes text-indigo-400"></i>
                            <span class="text-xs font-black uppercase tracking-wider text-slate-200 font-sans">Interactive 3D AR Viewer</span>
                        </div>
                        <button class="close-ar-modal w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-705 text-slate-400 flex items-center justify-center text-xs transition-colors cursor-pointer">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <!-- model-viewer body canvas -->
                    <div class="flex-1 bg-slate-950 relative flex items-center justify-center min-h-0">
                        <model-viewer
                            id="ar-mv-element"
                            src="${glbUrl}"
                            ar
                            ar-modes="webxr scene-viewer quick-look"
                            camera-controls
                            touch-action="pan-y"
                            shadow-intensity="1"
                            auto-rotate
                            class="w-full h-full"
                            style="--poster-color: transparent;">
                            <button slot="ar-button" class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-full shadow-[0_4px_15px_rgba(99,102,241,0.3)] flex items-center gap-2 text-xs transition-all pointer-events-auto hover:scale-105 active:scale-95 cursor-pointer">
                                <i class="fa-solid fa-expand"></i> View in AR Mode
                            </button>
                        </model-viewer>
                    </div>
                    
                    <!-- help info footer -->
                    <div class="p-3 text-center bg-slate-950/40 border-t border-slate-800 select-none">
                        <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-sans">Drag to rotate • Pinch to zoom</p>
                    </div>
                </div>
            `;

            arModal.querySelector('.close-ar-modal').addEventListener('click', closeArModal);
            arModal.addEventListener('click', (e) => {
                if (e.target === arModal) closeArModal();
            });

            document.body.appendChild(arModal);
        } else {
            const mv = arModal.querySelector('model-viewer');
            if (mv && mv.getAttribute('src') !== glbUrl) {
                mv.setAttribute('src', glbUrl);
            }
        }
    }

    function closeArModal() {
        const modal = document.getElementById('ar-viewer-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            modal.querySelector('.modal-container').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }
    }
})();
