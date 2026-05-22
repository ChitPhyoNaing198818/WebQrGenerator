/**
 * Surprise Extras Helper v1.0
 * Handles Surprise Release Countdown Lock and Google's interactive 3D AR Model Viewer.
 */
(function() {
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
})();
