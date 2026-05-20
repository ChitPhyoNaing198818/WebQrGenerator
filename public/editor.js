let setupCompleted = false;
let stateDataStorage = {};
let activeSelectedFile = "";
let qrCodeInstance = null;
let pendingFiles = {};
let activeMobileTab = 'editor';
let activeQRModalMobileTab = 'preview';
let currentQRMode = 'classic';
let activePosterTemplate = 'love';
let activeSchema = null;
let currentLang = localStorage.getItem('lang') || 'my';
let isLocalMusicPlaying = false;

const posterTemplates = {
    love: {
        top: 'when you put your hand in mine...',
        caption: 'kahani suno 2.0',
        names: 'SHREYA & PIYUSH',
        date: '01-08-2015',
        color: '#dc2626'
    },
    anniversary: {
        top: 'to many more years together...',
        caption: 'Our Wedding Anniversary',
        names: 'MR & MRS SMITH',
        date: 'Celebrating 10 Years',
        color: '#be123c'
    },
    birthday: {
        top: 'happy birthday to you!',
        caption: 'Wishing you a wonderful year ahead',
        names: 'EMILY JOHNSON',
        date: 'MAY 20, 2026',
        color: '#f59e0b'
    },
    success: {
        top: 'congratulations on your success!',
        caption: 'Class of 2026 Graduation Ceremony',
        names: 'SARA CONNOR',
        date: 'PROUD MOMENT',
        color: '#0ea5e9'
    },
    greeting: {
        top: 'a special surprise for you...',
        caption: 'Scan to reveal the beautiful message',
        names: 'DEAR FRIENDS',
        date: 'THANK YOU SO MUCH',
        color: '#10b981'
    }
};

const presetColors = {
    romantic: { bg: "#fff0f3", text: "#590d22", primary: "#ff758f", secondary: "#ff8fab" },
    gold: { bg: "#0b0f19", text: "#fef3c7", primary: "#d97706", secondary: "#f59e0b" },
    forest: { bg: "#f0fdf4", text: "#14532d", primary: "#16a34a", secondary: "#4ade80" },
    sunset: { bg: "#fff7ed", text: "#7c2d12", primary: "#ea580c", secondary: "#f97316" },
    lavender: { bg: "#faf5ff", text: "#581c87", primary: "#9333ea", secondary: "#c084fc" }
};

function syncResponsiveLayout() {
    const previewCol = document.getElementById('previewColumn');
    const controlPanel = document.getElementById('modificationControlPanel');
    const dock = document.getElementById('mobileTabsDock');
    
    if (!setupCompleted) {
        if (dock) dock.classList.add('hidden', '!hidden');
        return;
    }
    
    if (window.innerWidth >= 1024) {
        if (previewCol) {
            previewCol.classList.remove('hidden');
            previewCol.classList.add('flex');
        }
        if (controlPanel) {
            controlPanel.classList.remove('hidden');
            controlPanel.classList.add('block');
        }
        if (dock) {
            dock.classList.add('hidden');
            dock.classList.remove('flex');
        }
    } else {
        if (dock) {
            dock.classList.remove('hidden', '!hidden');
            dock.classList.add('flex');
        }
        
        if (activeMobileTab === 'editor') {
            if (previewCol) {
                previewCol.classList.add('hidden');
                previewCol.classList.remove('flex');
            }
            if (controlPanel) {
                controlPanel.classList.remove('hidden');
                controlPanel.classList.add('block');
            }
        } else {
            if (previewCol) {
                previewCol.classList.remove('hidden');
                previewCol.classList.add('flex');
            }
            if (controlPanel) {
                controlPanel.classList.add('hidden');
                controlPanel.classList.remove('block');
            }
        }
    }

    // Also sync the QR modal panels for responsiveness (Desktop showing both, Mobile matching selected tab)
    const qrLeftPanel = document.getElementById('qrModalLeftPanel');
    const qrRightPanel = document.getElementById('qrModalRightPanel');
    if (qrLeftPanel && qrRightPanel) {
        if (window.innerWidth >= 768) {
            qrLeftPanel.classList.remove('hidden');
            qrLeftPanel.classList.add('flex');
            qrRightPanel.classList.remove('hidden');
            qrRightPanel.classList.add('flex');
        } else {
            if (activeQRModalMobileTab === 'preview') {
                qrLeftPanel.classList.remove('hidden');
                qrLeftPanel.classList.add('flex');
                qrRightPanel.classList.add('hidden');
                qrRightPanel.classList.remove('flex');
            } else {
                qrLeftPanel.classList.add('hidden');
                qrLeftPanel.classList.remove('flex');
                qrRightPanel.classList.remove('hidden');
                qrRightPanel.classList.add('flex');
            }
        }
    }
}

function setMobileTab(tab) {
    activeMobileTab = tab;
    syncResponsiveLayout();
    
    const btnEditor = document.getElementById('mobileTabBtn-editor');
    const btnPreview = document.getElementById('mobileTabBtn-preview');
    const activeClass = "px-3.5 py-1.5 rounded-full text-[11px] font-sans font-bold transition-all duration-300 flex items-center gap-1.5 bg-indigo-600 text-white shadow-md shadow-indigo-500/15 active:scale-95";
    const inactiveClass = "px-3.5 py-1.5 rounded-full text-[11px] font-sans text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-all duration-300 flex items-center gap-1.5 active:scale-95";
    
    if (btnEditor && btnPreview) {
        if (tab === 'editor') {
            btnEditor.className = activeClass;
            btnPreview.className = inactiveClass;
        } else {
            btnPreview.className = activeClass;
            btnEditor.className = inactiveClass;
        }
    }
}

function setQRModalMobileTab(tab) {
    activeQRModalMobileTab = tab;
    const leftPanel = document.getElementById('qrModalLeftPanel');
    const rightPanel = document.getElementById('qrModalRightPanel');
    const tabPreview = document.getElementById('qrModalTabBtn-preview');
    const tabCustomize = document.getElementById('qrModalTabBtn-customize');
    
    if (window.innerWidth >= 768) {
        if (leftPanel) { leftPanel.classList.remove('hidden'); leftPanel.classList.add('flex'); }
        if (rightPanel) { rightPanel.classList.remove('hidden'); rightPanel.classList.add('flex'); }
        if (currentQRMode === 'poster') {
            renderLovePoster();
        }
        return;
    }
    
    if (tab === 'preview') {
        if (leftPanel) { leftPanel.classList.remove('hidden'); leftPanel.classList.add('flex'); }
        if (rightPanel) { rightPanel.classList.add('hidden'); rightPanel.classList.remove('flex'); }
        if (tabPreview) {
            tabPreview.className = "flex-1 py-3 text-[11px] font-black border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-sans transition-all flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900";
        }
        if (tabCustomize) {
            tabCustomize.className = "flex-1 py-3 text-[11px] font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 font-sans transition-all flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-950/20";
        }
    } else {
        if (leftPanel) { leftPanel.classList.add('hidden'); leftPanel.classList.remove('flex'); }
        if (rightPanel) { rightPanel.classList.remove('hidden'); rightPanel.classList.add('flex'); }
        if (tabPreview) {
            tabPreview.className = "flex-1 py-3 text-[11px] font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 font-sans transition-all flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-950/20";
        }
        if (tabCustomize) {
            tabCustomize.className = "flex-1 py-3 text-[11px] font-black border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-sans transition-all flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900";
        }
        if (currentQRMode === 'poster') {
            renderLovePoster();
        }
    }
}

function setQRMode(mode) {
    currentQRMode = mode;
    const btnClassic = document.getElementById('qrModeClassicBtn');
    const btnPoster = document.getElementById('qrModePosterBtn');
    const areaClassic = document.getElementById('qrClassicSettingsArea');
    const areaPoster = document.getElementById('qrPosterSettingsArea');
    const containerClassic = document.getElementById('qrcodeCanvasContainer');
    const containerPoster = document.getElementById('qrPosterPreviewContainer');
    
    if (mode === 'classic') {
        if (btnClassic) btnClassic.className = "flex-1 py-1.5 rounded-lg text-[10.5px] font-black transition-all bg-white dark:bg-slate-800 shadow-sm text-indigo-650 dark:text-indigo-400";
        if (btnPoster) btnPoster.className = "flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200";
        if (areaClassic) { areaClassic.classList.remove('hidden'); areaClassic.classList.add('block'); }
        if (areaPoster) { areaPoster.classList.add('hidden'); areaPoster.classList.remove('block'); }
        if (containerClassic) { containerClassic.classList.remove('hidden'); containerClassic.classList.add('block'); }
        if (containerPoster) { containerPoster.classList.add('hidden'); containerPoster.classList.remove('block'); }
    } else {
        if (btnClassic) btnClassic.className = "flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200";
        if (btnPoster) btnPoster.className = "flex-1 py-1.5 rounded-lg text-[10.5px] font-black transition-all bg-white dark:bg-rose-950/40 shadow-sm text-rose-600 dark:text-rose-400";
        if (areaClassic) { areaClassic.classList.add('hidden'); areaClassic.classList.remove('block'); }
        if (areaPoster) { areaPoster.classList.remove('hidden'); areaPoster.classList.add('block'); }
        if (containerClassic) { containerClassic.classList.add('hidden'); containerClassic.classList.remove('block'); }
        if (containerPoster) { containerPoster.classList.remove('hidden'); containerPoster.classList.add('block'); }
        renderLovePoster();
    }
}

function selectPosterTemplate(templateKey) {
    activePosterTemplate = templateKey;
    const btns = ['love', 'anniversary', 'birthday', 'success', 'greeting'];
    btns.forEach(btn => {
        const el = document.getElementById(`posterTplBtn-${btn}`);
        if (el) el.className = "p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 font-bold border-2 border-transparent text-[8px] transition-all flex flex-col items-center gap-1 cursor-pointer";
    });
    
    const activeEl = document.getElementById(`posterTplBtn-${templateKey}`);
    if (activeEl) activeEl.className = "p-2 bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-500 rounded-xl text-indigo-650 dark:text-indigo-400 font-extrabold text-[8px] transition-all flex flex-col items-center gap-1 cursor-pointer";
    
    const defaults = posterTemplates[templateKey];
    if (defaults) {
        const topInput = document.getElementById('posterTextTopInput');
        const captionInput = document.getElementById('posterTextCaptionInput');
        const namesInput = document.getElementById('posterNamesInput');
        const dateInput = document.getElementById('posterDateInput');
        if (topInput) topInput.value = defaults.top;
        if (captionInput) captionInput.value = defaults.caption;
        if (namesInput) namesInput.value = defaults.names;
        if (dateInput) dateInput.value = defaults.date;
        updatePosterThemeColor(defaults.color);
    }
}

function updatePosterText(field, val) { renderLovePoster(); }
function updatePosterThemeColor(color) {
    const picker = document.getElementById('posterColorPicker');
    const colorText = document.getElementById('posterColorText');
    if (picker) picker.value = color;
    if (colorText) colorText.innerText = color.toUpperCase();
    renderLovePoster();
}

function drawHeart(ctx, x, y, width, height, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - width / 2, y, x - width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - width / 2, y + (height + topCurveHeight) / 2, x, y + (height + topCurveHeight) / 2, x, y + height);
    ctx.bezierCurveTo(x, y + (height + topCurveHeight) / 2, x + width / 2, y + (height + topCurveHeight) / 2, x + width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawBalloons(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x - 10, y, size, size * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 4, size, size * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + (size * 1.3));
    ctx.bezierCurveTo(x - 10, y + 25, x, y + 20, x, y + 35);
    ctx.moveTo(x + 10, y + 4 + (size * 1.3));
    ctx.bezierCurveTo(x + 10, y + 28, x, y + 25, x, y + 35);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(x - 13, y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    ctx.save();
    let rot = Math.PI / 2 * 3; let x = cx; let y = cy; let step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step;
        x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

function drawBirthdayCake(ctx, x, y, color) {
    ctx.save(); ctx.fillStyle = '#cbd5e1'; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 45, y + 22, 90, 6, 3); else ctx.rect(x - 45, y + 22, 90, 6);
    ctx.fill(); ctx.fillStyle = color; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 35, y, 70, 22, [4, 4, 0, 0]); else ctx.rect(x - 35, y, 70, 22);
    ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 35, y);
    for (let i = -35; i <= 35; i += 14) ctx.arc(x + i, y, 7, 0, Math.PI, false);
    ctx.lineTo(x + 35, y); ctx.closePath(); ctx.fill();
    const candleX = [x - 15, x, x + 15];
    candleX.forEach(cx => {
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(cx - 3, y - 14, 6, 14);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)'; ctx.beginPath(); ctx.arc(cx, y - 20, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(cx, y - 24); ctx.bezierCurveTo(cx - 2.5, y - 21, cx - 2.5, y - 18, cx, y - 18); ctx.bezierCurveTo(cx + 2.5, y - 18, cx + 2.5, y - 21, cx, y - 24); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
}

function drawTrophy(ctx, x, y, color) {
    ctx.save(); ctx.fillStyle = '#f59e0b'; ctx.fillRect(x - 25, y + 18, 50, 8); ctx.fillRect(x - 5, y + 3, 10, 15);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y - 7, 18, 0, Math.PI, false); ctx.lineTo(x + 18, y - 20); ctx.lineTo(x - 18, y - 20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#eab308'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x - 18, y - 10, 7, Math.PI * 0.5, Math.PI * 1.5, false); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 18, y - 10, 7, Math.PI * 1.5, Math.PI * 2.5, false); ctx.stroke();
    drawStar(ctx, x, y - 10, 4, 7, 2.5, '#ffffff'); ctx.restore();
}

function drawFoliage(ctx, x, y, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 8, y + 22); ctx.quadraticCurveTo(x, y + 2, x + 4, y - 18); ctx.stroke();
    ctx.fillStyle = color;
    const leaves = [
        { lx: x - 4, ly: y + 12, rot: -0.4 }, { lx: x + 5, ly: y + 6, rot: 0.4 }, { lx: x - 2, ly: y - 4, rot: -0.3 }, { lx: x + 6, ly: y - 10, rot: 0.3 }, { lx: x + 4, ly: y - 18, rot: 0 }
    ];
    leaves.forEach(leaf => {
        ctx.save(); ctx.translate(leaf.lx, leaf.ly); ctx.rotate(leaf.rot); ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    ctx.restore();
}

function drawCandleDecor(ctx, x, y, color) {
    ctx.save(); ctx.fillStyle = color; ctx.fillRect(x - 2.5, y, 5, 12);
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.ellipse(x, y - 3, 2.5, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function renderLovePoster() {
    const canvas = document.getElementById('qrPosterCanvas'); if (!canvas) return;
    canvas.width = 600; canvas.height = 800; const ctx = canvas.getContext('2d');
    const colorTheme = document.getElementById('posterColorPicker')?.value || '#dc2626';
    const textTop = document.getElementById('posterTextTopInput')?.value || "when you put your hand in mine...";
    const textCaption = document.getElementById('posterTextCaptionInput')?.value || "kahani suno 2.0";
    const namesText = document.getElementById('posterNamesInput')?.value || "SHREYA & PIYUSH";
    const dateText = document.getElementById('posterDateInput')?.value || "01-08-2015";
    
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 600, 800);
    ctx.strokeStyle = colorTheme; ctx.lineWidth = 2; ctx.strokeRect(30, 30, 540, 740);
    ctx.lineWidth = 0.5; ctx.strokeRect(36, 36, 528, 728);
    
    ctx.save(); ctx.fillStyle = colorTheme; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = 'italic 34px "Caveat", "Brush Script MT", "Playfair Display", serif';
    ctx.fillText(textTop, 300, 75); ctx.restore();
    
    if (activePosterTemplate === 'love' || activePosterTemplate === 'anniversary') {
        drawHeart(ctx, 300, 125, 14, 14, colorTheme); drawHeart(ctx, 325, 128, 8, 8, colorTheme); drawHeart(ctx, 275, 128, 8, 8, colorTheme);
    } else if (activePosterTemplate === 'birthday') {
        drawBalloons(ctx, 300, 122, 8, colorTheme); drawStar(ctx, 255, 128, 4, 7, 2.5, '#f59e0b'); drawStar(ctx, 345, 128, 4, 7, 2.5, '#38bdf8');
    } else if (activePosterTemplate === 'success') {
        drawStar(ctx, 300, 125, 5, 11, 4.5, '#eab308'); drawStar(ctx, 330, 128, 5, 6.5, 3, '#cbd5e1'); drawStar(ctx, 270, 128, 5, 6.5, 3, '#cbd5e1');
    } else {
        drawFoliage(ctx, 300, 112, colorTheme);
    }
    
    const qrSize = 250; const qrX = (600 - qrSize) / 2; const qrY = 175;
    const originCanvas = document.getElementById('qrcodeCanvas')?.querySelector('canvas');
    if (originCanvas) {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
        ctx.drawImage(originCanvas, qrX, qrY, qrSize, qrSize);
    } else {
        ctx.fillStyle = '#fafafa'; ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 2; ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        if (activePosterTemplate === 'love' || activePosterTemplate === 'anniversary') drawHeart(ctx, 300, 275, 60, 60, '#fca5a5');
        else if (activePosterTemplate === 'birthday') drawBirthdayCake(ctx, 300, 270, '#fde047');
        else if (activePosterTemplate === 'success') drawTrophy(ctx, 300, 275, '#cbd5e1');
        else drawFoliage(ctx, 300, 270, '#cbd5e1');
        ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'; ctx.font = 'bold 12px "Montserrat", sans-serif'; ctx.fillText("GENERATE CARD TO UNLOCK QR", 300, 365);
    }
    
    ctx.save(); ctx.fillStyle = '#1e293b'; ctx.textAlign = 'center'; ctx.font = 'bold 18px "Montserrat", sans-serif';
    ctx.fillText(textCaption, 300, 475); ctx.restore();
    
    const playerY = 515;
    if (activePosterTemplate === 'love') {
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(180, playerY + 30); ctx.lineTo(420, playerY + 30); ctx.stroke();
        ctx.strokeStyle = colorTheme; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(180, playerY + 30); ctx.lineTo(264, playerY + 30); ctx.stroke();
        ctx.fillStyle = colorTheme; ctx.beginPath(); ctx.arc(264, playerY + 30, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(235, playerY); ctx.lineTo(245, playerY - 6); ctx.lineTo(245, playerY + 6); ctx.closePath(); ctx.fill(); ctx.fillRect(231, playerY - 6, 2.5, 12);
        ctx.fillStyle = colorTheme; ctx.beginPath(); ctx.arc(300, playerY, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(296, playerY - 6); ctx.lineTo(307, playerY); ctx.lineTo(296, playerY + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(365, playerY); ctx.lineTo(355, playerY - 6); ctx.lineTo(355, playerY + 6); ctx.closePath(); ctx.fill(); ctx.fillRect(366, playerY - 6, 2.5, 12);
    } else if (activePosterTemplate === 'anniversary') {
        drawHeart(ctx, 280, playerY, 35, 35, 'rgba(251, 113, 133, 0.4)'); drawHeart(ctx, 320, playerY, 35, 35, colorTheme);
        drawStar(ctx, 255, playerY - 15, 4, 7, 3, '#f59e0b'); drawStar(ctx, 345, playerY + 15, 4, 7, 3, '#e2e8f0');
    } else if (activePosterTemplate === 'birthday') {
        drawBirthdayCake(ctx, 300, playerY - 10, colorTheme); drawBalloons(ctx, 160, playerY - 5, 9, '#ea580c'); drawBalloons(ctx, 440, playerY - 5, 9, '#38bdf8');
    } else if (activePosterTemplate === 'success') {
        drawTrophy(ctx, 300, playerY - 8, colorTheme); drawStar(ctx, 190, playerY, 5, 8, 3, '#eab308'); drawStar(ctx, 215, playerY - 12, 4, 6, 2, '#38bdf8'); drawStar(ctx, 385, playerY - 8, 5, 8, 3, '#ea580c'); drawStar(ctx, 410, playerY + 10, 4, 6, 2, '#a78bfa');
    } else {
        drawFoliage(ctx, 300, playerY - 18, colorTheme); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(200, playerY + 22); ctx.lineTo(400, playerY + 22); ctx.stroke();
    }
    
    ctx.save(); ctx.fillStyle = '#0f172a'; ctx.textAlign = 'center';
    const formattedNames = namesText.toUpperCase().split("").join("  ");
    ctx.font = '900 21px "Montserrat", sans-serif'; ctx.fillText(formattedNames, 300, 615); ctx.restore();
    
    ctx.save(); ctx.fillStyle = colorTheme; ctx.textAlign = 'center'; ctx.font = '800 14px "Montserrat", sans-serif'; ctx.fillText(dateText, 300, 675); ctx.restore();
    
    if (activePosterTemplate === 'love' || activePosterTemplate === 'anniversary') drawHeart(ctx, 300, 715, 18, 18, colorTheme);
    else if (activePosterTemplate === 'birthday') drawCandleDecor(ctx, 300, 712, colorTheme);
    else if (activePosterTemplate === 'success') drawStar(ctx, 300, 718, 5, 9, 4, '#eab308');
    else drawStar(ctx, 300, 718, 4, 8, 3.5, colorTheme);
}

function onQRSaveClick() {
    if (currentQRMode === 'classic') {
        if (!qrCodeInstance) return;
        qrCodeInstance.download({ name: "love-card-qr", extension: "png" });
    } else {
        const canvas = document.getElementById('qrPosterCanvas'); if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png'); const link = document.createElement('a');
        link.download = `love-poster-${document.getElementById('posterNamesInput')?.value.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'card'}.png`;
        link.href = dataUrl; link.click();
    }
}

function applyQRDotsType(type, btnElement) {
    updateQRDesign('dotsOptions.type', type);
    const parent = document.getElementById('qrDotsTypeSelector');
    if (parent) {
        const buttons = parent.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.className = "p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors font-sans";
        });
    }
    if (btnElement) btnElement.className = "p-2 border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-sans";
}

function applyQRColorPreset(colorHex) {
    updateQRDesign('dotsOptions.color', colorHex);
    updateQRDesign('cornersSquareOptions.color', colorHex);
    updateQRDesign('cornersDotOptions.color', colorHex);
    const p = document.getElementById('qrBrandColorPicker'); if (p) p.value = colorHex;
}

async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) return resolve(file);
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); let width = img.width; let height = img.height;
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })), 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

function updateQRDesign(path, value) {
    if (!qrCodeInstance) return; const options = {}; const keys = path.split('.'); let current = options;
    for (let i = 0; i < keys.length - 1; i++) { current[keys[i]] = {}; current = current[keys[i]]; }
    current[keys[keys.length - 1]] = value; qrCodeInstance.update(options);
}

function applyQRCoverUrl(url) {
    updateQRDesign('image', url); const cb = document.getElementById('clearCoverBtn');
    if (cb) { if (url.trim()) cb.classList.remove('hidden'); else cb.classList.add('hidden'); }
}

function handleQRCoverUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0]; const reader = new FileReader();
        reader.onload = function(e) {
            updateQRDesign('image', e.target.result); const cb = document.getElementById('clearCoverBtn'); if (cb) cb.classList.remove('hidden');
            const ui = document.getElementById('qrCoverUrlInput'); if (ui) { ui.value = ""; ui.placeholder = "Custom: " + file.name; }
        };
        reader.readAsDataURL(file);
    }
}

function clearQRCover() {
    updateQRDesign('image', ''); const cb = document.getElementById('clearCoverBtn'); if (cb) cb.classList.add('hidden');
    const ui = document.getElementById('qrCoverUrlInput'); if (ui) { ui.value = ""; ui.placeholder = "https://example.com/logo.png"; }
    const fi = document.getElementById('qrCoverFileInput'); if (fi) fi.value = '';
    const ti = document.getElementById('qrTextCoverInput'); if (ti) ti.value = '';
}

function toggleQRTextCoverShape(btn) {
    const current = btn.getAttribute('data-shape') || 'circle'; const next = current === 'circle' ? 'square' : 'circle';
    btn.setAttribute('data-shape', next); btn.innerHTML = next === 'circle' ? '<i class="fa-regular fa-circle"></i>' : '<i class="fa-regular fa-square"></i>';
    applyQRTextCoverFromUI();
}

function toggleQRTextCoverColor(btn) {
    const current = btn.getAttribute('data-color') || 'white'; const next = current === 'white' ? 'black' : 'white';
    btn.setAttribute('data-color', next); btn.innerHTML = 'A';
    if (next === 'white') btn.className = "w-7.5 h-7.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors";
    else btn.className = "w-7.5 h-7.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-extrabold text-indigo-400 hover:bg-slate-850 transition-colors";
    applyQRTextCoverFromUI();
}

function applyQRTextCoverFromUI() {
    const textInput = document.getElementById('qrTextCoverInput'); if (!textInput) return;
    const text = textInput.value.trim();
    if (!text) {
        updateQRDesign('image', ''); const cb = document.getElementById('clearCoverBtn'); if (cb) cb.classList.add('hidden');
        const ui = document.getElementById('qrCoverUrlInput'); if (ui) { ui.value = ""; ui.placeholder = "https://example.com/logo.png"; }
        return;
    }
    const shapeBtn = document.getElementById('qrTextCoverShapeBtn');
    const bgPicker = document.getElementById('qrTextCoverBgPicker');
    const colorBtn = document.getElementById('qrTextCoverTextColorBtn');
    const bgIndicator = document.getElementById('qrTextCoverBgIndicator');
    const isCircle = shapeBtn ? (shapeBtn.getAttribute('data-shape') !== 'square') : true;
    const badgeColor = bgPicker ? bgPicker.value : '#4f46e5';
    const textColor = colorBtn ? (colorBtn.getAttribute('data-color') === 'black' ? '#0f172a' : '#ffffff') : '#ffffff';
    if (bgIndicator) bgIndicator.style.backgroundColor = badgeColor;
    applyQRTextCover(text, badgeColor, textColor, isCircle);
}

function applyQRTextCover(text, badgeColor, textColor, isCircle) {
    try {
        const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 120; const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.beginPath();
        if (isCircle) ctx.arc(60, 60, 58, 0, Math.PI * 2); else ctx.rect(2, 2, 116, 116);
        ctx.fill(); ctx.fillStyle = badgeColor;
        if (isCircle) {
            ctx.beginPath(); ctx.arc(60, 60, 53, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
        } else {
            const r = 18; const x = 6; const y = 6; const w = 108; const h = 108;
            ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
        }
        ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let fontSize = 24;
        if (text.length > 6) fontSize = 13; else if (text.length > 5) fontSize = 15; else if (text.length > 4) fontSize = 18; else if (text.length > 3) fontSize = 20; else if (text.length > 2) fontSize = 24;
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(text.toUpperCase(), 60, 60);
        updateQRDesign('image', canvas.toDataURL('image/png'));
        const cb = document.getElementById('clearCoverBtn'); if (cb) cb.classList.remove('hidden');
        const ui = document.getElementById('qrCoverUrlInput'); if (ui) { ui.value = ""; ui.placeholder = "Text Label: " + text.toUpperCase(); }
    } catch (err) { console.error("Text cover error:", err); }
}

function applyQREmojiCover(emoji) {
    try {
        const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 120; const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(60, 60, 54, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 4; ctx.stroke();
        ctx.font = '64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, 60, 64);
        updateQRDesign('image', canvas.toDataURL('image/png'));
        const cb = document.getElementById('clearCoverBtn'); if (cb) cb.classList.remove('hidden');
        const ui = document.getElementById('qrCoverUrlInput'); if (ui) { ui.value = ""; ui.placeholder = "Preset: " + emoji; }
    } catch(e) { console.error(e); }
}

function switchTemplateFile(fileName, cardId) {
    if (document.body.classList.contains('landing-active')) {
        document.body.classList.remove('landing-active');
    }
    const phone = document.getElementById('iphoneFrame'); if (phone) phone.classList.remove('tutorial-mode');
    const container = document.getElementById('previewContainer');
    const headerBar = document.getElementById('previewHeaderBar');
    const viewport = document.getElementById('previewViewport');
    const floatingBtn = document.getElementById('floatingOpenTabBtn');
    if (container) container.className = "w-full border-0 bg-transparent shadow-none flex flex-col h-[560px] sm:h-[620px] lg:h-[660px] relative transition-all duration-500";
    if (headerBar) headerBar.className = "hidden";
    if (viewport) viewport.className = "flex-1 bg-transparent p-3 sm:p-4 lg:p-6 flex items-center justify-center overflow-hidden relative min-h-0 transition-all duration-500";
    if (floatingBtn) floatingBtn.classList.remove('opacity-0', 'pointer-events-none');
    
    activeSelectedFile = fileName; document.getElementById('previewIframe').src = fileName;
    stateDataStorage = {}; pendingFiles = {};

    const buttons = document.querySelectorAll('.mobile-tab-btn, .template-card');
    buttons.forEach(btn => {
        btn.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-600', 'text-white', 'border-indigo-500', 'scale-[1.015]', 'scale-[1.02]');
        if (btn.classList.contains('mobile-tab-btn')) {
            btn.className = "mobile-tab-btn whitespace-nowrap px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[12px] font-bold transition-all active:scale-95 flex items-center space-x-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm";
            const ii = btn.querySelector('.icon-wrap'); if (ii) { const oc = ii.getAttribute('data-original-class'); if (oc) ii.className = oc; }
        } else if (btn.classList.contains('template-card')) {
            btn.classList.remove('border-indigo-500', 'dark:border-indigo-400', 'border-2', 'shadow-md');
            btn.classList.add('border', 'border-slate-200', 'dark:border-slate-800/80');
            const ind = btn.querySelector('.active-dot'); if (ind) ind.classList.add('hidden');
            const t = btn.querySelector('h3');
            if (t) {
                t.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'text-pink-600', 'dark:text-pink-400', 'text-rose-600', 'dark:text-rose-400', 'text-amber-600', 'dark:text-amber-400', 'text-emerald-600', 'dark:text-emerald-400', 'text-purple-600', 'dark:text-purple-400', 'text-yellow-600', 'dark:text-yellow-400', 'text-blue-600', 'dark:text-blue-400', 'text-sky-600', 'dark:text-sky-400');
                t.classList.add('text-slate-800', 'dark:text-slate-100');
            }
        }
    });

    const mobileBtn = document.getElementById(`mobile-${cardId}`);
    if (mobileBtn) {
        let mobileBg = "bg-indigo-600 border-indigo-600 shadow-indigo-500/20"; let textColor = "text-white";
        if (cardId === 'btn-index') mobileBg = "bg-pink-600 border-pink-600 shadow-pink-500/20";
        else if (cardId === 'btn-cv') mobileBg = "bg-rose-600 border-rose-600 shadow-rose-500/20";
        else if (cardId === 'btn-blog') mobileBg = "bg-amber-600 border-amber-600 shadow-amber-500/20";
        else if (cardId === 'btn-christmas') mobileBg = "bg-emerald-600 border-emerald-600 shadow-emerald-500/20";
        else if (cardId === 'btn-anniversary') mobileBg = "bg-purple-600 border-purple-600 shadow-purple-500/20";
        else if (cardId === 'btn-birthday') { mobileBg = "bg-yellow-400 border-yellow-400 shadow-yellow-400/20"; textColor = "text-slate-950"; }
        else if (cardId === 'btn-mother') mobileBg = "bg-pink-500 border-pink-500 shadow-pink-400/20";
        else if (cardId === 'btn-father') mobileBg = "bg-blue-600 border-blue-600 shadow-blue-500/20";
        else if (cardId === 'btn-friend') mobileBg = "bg-sky-600 border-sky-600 shadow-sky-500/20";
        mobileBtn.className = `mobile-tab-btn whitespace-nowrap px-3.5 py-2 rounded-xl ${textColor} text-[12px] font-extrabold transition-all active:scale-95 flex items-center space-x-2 border shadow-md ${mobileBg}`;
        const ii = mobileBtn.querySelector('.icon-wrap');
        if (ii) { const ib = (cardId === 'btn-birthday') ? 'bg-slate-950/15 text-slate-950' : 'bg-white/20 text-white'; ii.className = `icon-wrap inline-flex items-center justify-center w-5 h-5 rounded-md ${ib} text-[10px]`; }
    }

    const desktopBtn = document.getElementById(cardId);
    if (desktopBtn) {
        let activeBorderColor = 'border-indigo-500'; let activeDarkBorderColor = 'dark:border-indigo-400';
        if (cardId === 'btn-index') { activeBorderColor = 'border-pink-500'; activeDarkBorderColor = 'dark:border-pink-400'; }
        else if (cardId === 'btn-cv') { activeBorderColor = 'border-rose-500'; activeDarkBorderColor = 'dark:border-rose-400'; }
        else if (cardId === 'btn-blog') { activeBorderColor = 'border-amber-500'; activeDarkBorderColor = 'dark:border-amber-400'; }
        else if (cardId === 'btn-christmas') { activeBorderColor = 'border-emerald-500'; activeDarkBorderColor = 'dark:border-emerald-400'; }
        else if (cardId === 'btn-anniversary') { activeBorderColor = 'border-purple-500'; activeDarkBorderColor = 'dark:border-purple-400'; }
        else if (cardId === 'btn-birthday') { activeBorderColor = 'border-yellow-500'; activeDarkBorderColor = 'dark:border-yellow-400'; }
        else if (cardId === 'btn-mother') { activeBorderColor = 'border-pink-400'; activeDarkBorderColor = 'dark:border-pink-400'; }
        else if (cardId === 'btn-father') { activeBorderColor = 'border-blue-500'; activeDarkBorderColor = 'dark:border-blue-400'; }
        else if (cardId === 'btn-friend') { activeBorderColor = 'border-sky-500'; activeDarkBorderColor = 'dark:border-sky-400'; }
        desktopBtn.classList.remove('border-slate-200', 'dark:border-slate-800/80', 'border');
        desktopBtn.classList.add('border-2', activeBorderColor, activeDarkBorderColor, 'bg-slate-50/50', 'dark:bg-slate-800/20', 'shadow-[0_12_24_-8_rgba(99,102,241,0.22)]', 'scale-[1.015]');
        const ind = desktopBtn.querySelector('.active-dot'); if (ind) ind.classList.remove('hidden');
        const t = desktopBtn.querySelector('h3');
        if (t) {
            t.classList.remove('text-slate-800', 'dark:text-slate-100');
            let ac = 'text-indigo-600', adc = 'dark:text-indigo-400';
            if (cardId === 'btn-index') { ac = 'text-pink-600'; adc = 'dark:text-pink-400'; }
            else if (cardId === 'btn-cv') { ac = 'text-rose-600'; adc = 'dark:text-rose-400'; }
            else if (cardId === 'btn-blog') { ac = 'text-amber-600'; adc = 'dark:text-amber-400'; }
            else if (cardId === 'btn-christmas') { ac = 'text-emerald-600'; adc = 'dark:text-emerald-400'; }
            else if (cardId === 'btn-anniversary') { ac = 'text-purple-600'; adc = 'dark:text-purple-400'; }
            else if (cardId === 'btn-birthday') { ac = 'text-yellow-600'; adc = 'dark:text-yellow-400'; }
            else if (cardId === 'btn-mother') { ac = 'text-pink-600'; adc = 'dark:text-pink-400'; }
            else if (cardId === 'btn-father') { ac = 'text-blue-600'; adc = 'dark:text-blue-400'; }
            else if (cardId === 'btn-friend') { ac = 'text-sky-600'; adc = 'dark:text-sky-400'; }
            t.classList.add(ac, adc);
        }
    }

    if (!setupCompleted) {
        setupCompleted = true;
        const placeholder = document.getElementById('controlPanelPlaceholder');
        const content = document.getElementById('controlPanelContent');
        if (placeholder) { placeholder.classList.add('opacity-0', 'scale-90'); setTimeout(() => placeholder.classList.add('hidden'), 350); }
        if (content) { content.classList.remove('hidden'); setTimeout(() => content.classList.remove('opacity-0', 'scale-95'), 50); }
    }
    syncResponsiveLayout();
}

const locales = {
    my: {
        logoText: "Web & QR ဖန်တီးစနစ်", activeLayouts: "ဒီဇိုင်းပုံစံများ", customizeStudio: "ပုံစံပြင်ဆင်မည်", generateBtn: "ဝဘ်ဆိုက်နှင့် QR ဖန်တီးမည်", generatingBtn: "ဖန်တီးနေပါသည်...", closeEditor: "ပိတ်မည်", qrStylist: "QR ပုံစံပြင်ဆင်မှု", dotsStyle: "အစက်များပုံစံ", outerFrame: "အပြင်ဘောင်ပုံစံ", innerCore: "အတွင်းပိုင်းဒီဇိုင်း", brandColor: "အမှတ်တံဆိပ်အရောင်", canvasBg: "နောက်ခံအရောင်", centerOverlay: "အလယ်တံဆိပ်တုံးပုံ", copyBtn: "လင့်ခ်ကူးယူမည်", saveBtn: "ပုံသိမ်းဆည်းမည်", themeSuite: "အပြင်အဆင်ရွေးချယ်မှု", moodPresets: "အရောင် Preset ရွေးချယ်မှု", preloadedTracks: "နောက်ခံတေးသီချင်းများ", particlesTitle: "လွင့်ပျံမည့် သင်္ကေတများ", selectTrack: "တေးသီချင်းရွေးချယ်ပါ", selectParticle: "သင်္ကေတရွေးချယ်ပါ", languageTitle: "ဘာသာစကား",
        presets: { romantic: "ရိုမန်တစ် ပန်းရောင်", gold: "မီးခိုးရွှေရောင်", forest: "သစ်တောစိမ်း", sunset: "ဆည်းဆာဝါး", lavender: "လဗင်ဒါကမ္ဘာ" },
        tracks: { choose: "တေးသီချင်းရွေးချယ်ပါ...", guitar: "ရိုမန်တစ် ဂစ်တာ", piano: "နူးညံ့သော ပီယာနို", lofi: "ချမ်းမြေ့ဖွယ် Lofi", waltz: "အိပ်မက်ဝေါ့ဇ်", birthday: "မွေးနေ့သီချင်း" },
        particles: { choose: "သင်္ကေတရွေးချယ်ပါ...", hearts: "❤️ အသည်းပုံလေးများ", sparkles: "✨ တောက်ပသောကြယ်ပွင့်", sakura: "🌸 ချယ်ရီပန်းပွင့်လေးများ", snow: "❄️ ဆောင်းနှင်းပွင့်လေးများ", balloons: "🎈 မိုးပျံပူဖောင်းများ", stars: "⭐ ရွှေရောင် ကြယ်ပွင့်များ", clover: "🍀 ကံကောင်းခြင်းရွက်" },
        templateNames: { "btn-index": "အချစ်ကတ်ပြားလေး", "btn-cv": "အချစ်လက်ခံပါရစေ", "btn-blog": "အံ့ဩဖွယ် စာမျက်နှာ", "btn-christmas": "ခရစ္စမတ်ဆုတောင်း", "btn-anniversary": "နှစ်ပတ်လည်အမှတ်တရ", "btn-birthday": "မွေးနေ့ဆုတောင်း", "btn-mother": "အမေများနေ့", "btn-father": "အဖေများနေ့", "btn-friend": "သူငယ်ချင်းမိတ်ဆွေ" },
        templateDescs: { "btn-index": "ဖွင့်လှစ်တုံ့ပြန် ချစ်ရေးဆိုစာအိတ်လေး", "btn-cv": "ကျီစယ်ရင်ဖွင့်မည့် Yes/No တုံ့ပြန်ခလုတ်ပါဝင်သောကတ်", "btn-blog": "အမှတ်တရပုံရိပ်များနှင့် အံ့ဩစရာ ဆောင်းပါးကတ်", "btn-christmas": "လှပသောနှင်းပွင့်များနှင့် ခရစ္စမတ်ဆုတောင်းကတ်", "btn-anniversary": "စုံတွဲများအတွက် နှစ်ပတ်လည်မှတ်တမ်းစာမျက်နှာ", "btn-birthday": "မွေးနေ့ရှင်ပုံရိပ်နှင့် ဆုတောင်းမွေးနေ့ကတ်", "btn-mother": "ကျေးဇူးဆပ်ဆုတောင်းမေတ္တာ အမေများနေ့ကတ်", "btn-father": "လေးစားတန်ဖိုးထားမှုများဖြင့် အဖေများနေ့ကတ်", "btn-friend": "သူငယ်ချင်းနှောင်ကြိုး အမှတ်တရပုံရိပ်ကတ်လေး" },
        welcomeHeader: "ဒီဇိုင်းပြင်ဆင်ရေး စတူဒီယို", welcomeDesc: "ဘယ်ဘက်ရှိ ဒီဇိုင်းတစ်ခုခုကို ရွေးချယ်ပြီး လှပသပ်ရပ်စွာ ကိုယ်ပိုင်အချက်အလက်များ ပြောင်းလဲဖန်တီးလိုက်ပါ။",
        labels: {
            "title": "စာအိတ်တွင်း ခေါင်းစဉ်", "message": "ရင်ဖွင့်လွှာ စာသားများ", "sealText": "တံဆိပ်ခတ်နှိပ်စာသား", "hints": "စာအိတ်အောက် ညွှန်ကြားစာ", "colorBg": "နောက်ခံ Background အရောင်", "colorText": "စာသား စာလုံးအရောင်", "colorEnvelope": "စာအိတ် ကိုယ်ထည်အရောင်", "colorFlap": "စာအိတ် အဖုံးအရောင်", "waxIcon": "တံဆိပ်တုံး Icon (Emoji)", "sideEmoji": "ဘေးဘက် အလှဆင် (Emoji)", "bgMusic": "နောက်ခံ တေးဂီတ", "bday_name": "ဂုဏ်ပြုခံရသူ အမည်", "bday_message": "အထူးဆုတောင်းစကား", "bday_image": "ပရိုဖိုင်ဓာတ်ပုံ", "bday_wish": "အောက်ခြေဆုတောင်းချက်", "bday_emoji": "ဂုဏ်ပြုသင်္ကေတ (Emoji)", "bg_color": "နောက်ခံအရောင်", "bg_track": "နောက်ခံတေးသီချင်း", "anniv_title": "နှစ်ပတ်လည် ခေါင်းစဉ်", "anniv_years": "နှစ်ပတ်လည် နှစ်အရေအတွက်", "anniv_desc": "အမှတ်တရစာလွှာ", "anniv_main_img": "ပင်မဓာတ်ပုံ", "anniv_music": "နောက်ခံတေးဂီတ", "cv_title": "မေးခွန်း ခေါင်းစဉ်", "cv_sub": "ရှင်းပြချက် စာသား", "cv_yes": "လက်ခံသည် ကတ်ခလုတ်", "cv_no": "ငြင်းပယ်သည် ကတ်ခလုတ်", "cv_music": "နောက်ခံတေးသီချင်း", "blog_title": "ဘလော့ခ် ခေါင်းစဉ်", "blog_body": "စာသား အချက်အလက်", "blog_banner": "မျက်နှာဖုံးပုံ",
            "queenName": "ချစ်သူ/မွေးနေ့ရှင် အမည်", "christmasWish": "Christmas ဆုတောင်းစကား", "photo1": "ဓာတ်ပုံ အမိုက်စား (၁)", "photo2": "ဓာတ်ပုံ အမိုက်စား (၂)", "photo3": "ဓာတ်ပုံ အမိုက်စား (၃)", "bgMusicTrack": "နောက်ခံသီချင်း (.mp3)"
        }
    },
    en: {
        logoText: "Web & QR Generator", activeLayouts: "Active Layouts", customizeStudio: "Customize Studio", generateBtn: "Web & QR Generate", generatingBtn: "Generating...", closeEditor: "Close Editor", qrStylist: "QR Stylist", dotsStyle: "Dots Style", outerFrame: "Outer Frame", innerCore: "Inner Core", brandColor: "Brand Color", canvasBg: "Canvas Bg", centerOverlay: "Center Overlay", copyBtn: "Copy", saveBtn: "Save", themeSuite: "Theme & Presets", moodPresets: "One-Click Mood Presets", preloadedTracks: "Preloaded Soundtracks", particlesTitle: "Floating Particles", selectTrack: "Select Soundtrack", selectParticle: "Select Particle", languageTitle: "Language",
        presets: { romantic: "Romantic Pink", gold: "Midnight Gold", forest: "Forest Fresh", sunset: "Sunset Warmth", lavender: "Cosmic Lavender" },
        tracks: { choose: "Choose a soundtrack...", guitar: "Romantic Guitar", piano: "Sweet Piano", lofi: "Chill Lofi Beat", waltz: "Dreamy Waltz", birthday: "Happy Birthday Music" },
        particles: { choose: "Choose a particle...", hearts: "❤️ Hearts", sparkles: "✨ Sparkles", sakura: "🌸 Cherry Blossoms", snow: "❄️ Snowflakes", balloons: "🎈 Balloons", stars: "⭐ Golden Stars", clover: "🍀 Clover Leaves" },
        templateNames: { "btn-index": "Digital Love Card", "btn-cv": "Will You Be Mine", "btn-blog": "Surprise Blog", "btn-christmas": "Merry Christmas", "btn-anniversary": "Anniversary", "btn-birthday": "Birthday", "btn-mother": "Mother Day", "btn-father": "Father Day", "btn-friend": "Friendship" },
        templateDescs: { "btn-index": "Romantic unfolding envelope letter", "btn-cv": "Interactive Yes/No proposal questions", "btn-blog": "Photo story surprise journal entry", "btn-christmas": "Charming snowy festival wishes", "btn-anniversary": "Milestone scrapbook for couples", "btn-birthday": "Celebrant portrait with festive sparkles", "btn-mother": "Appreciative floral tribute card", "btn-father": "Strong premium fatherly salute theme", "btn-friend": "Warm slide photo besties memory book" },
        welcomeHeader: "Design Studio Awaits!", welcomeDesc: "Choose a premade layout template from the directory to unlock fine-grain visual and text editing controls.",
        labels: {
            "title": "Envelope Title", "message": "Message Body", "sealText": "Wax Seal Label", "hints": "Under Helper Hint", "colorBg": "Background Color", "colorText": "Text Color", "colorEnvelope": "Envelope Base Color", "colorFlap": "Envelope Flap Color", "waxIcon": "Wax Seal Icon", "sideEmoji": "Side Embellishment", "bgMusic": "Background Music", "bday_name": "Celebrant Name", "bday_message": "Birthday Message", "bday_image": "Celebrant Photo", "bday_wish": "Bottom Wish Note", "bday_emoji": "Celebration Emoji", "bg_color": "Background Fill", "bg_track": "Music Soundtrack", "anniv_title": "Anniversary Title", "anniv_years": "Years Count", "anniv_desc": "Anniversary Letter", "anniv_main_img": "Memory Backdrop", "anniv_music": "Waltz Soundtrack", "cv_title": "Propose Title", "cv_sub": "Love Description", "cv_yes": "Yes Label Button", "cv_no": "No Label Button", "cv_music": "Atmosphere Track", "blog_title": "Surprise Blog Banner", "blog_body": "Diary Prose", "blog_banner": "Intro Image",
            "queenName": "Recipient Name", "christmasWish": "Christmas Message", "photo1": "Lovely Photo (1)", "photo2": "Lovely Photo (2)", "photo3": "Lovely Photo (3)", "bgMusicTrack": "Background Track (.mp3)"
        }
    }
};

function applyLocalization() {
    const l = locales[currentLang];
    const logoLabel = document.querySelector('nav span'); if (logoLabel) logoLabel.innerText = l.logoText;
    const sidebarHeading = document.querySelector('aside h2'); if (sidebarHeading) sidebarHeading.innerHTML = `<i class="fa-solid fa-swatchbook mr-1.5 p-0.5"></i> ${l.activeLayouts}`;
    const liveTitle = document.getElementById('live-preview-title'); if (liveTitle) liveTitle.innerText = currentLang === 'my' ? "တိုက်ရိုက် အစမ်းကြည့်ရှုမှု" : "Live Preview";
    const welcomeHeader = document.getElementById('welcome-header'); if (welcomeHeader) welcomeHeader.innerText = l.welcomeHeader;
    const welcomeDesc = document.getElementById('welcome-desc'); if (welcomeDesc) welcomeDesc.innerText = l.welcomeDesc;

    for (const key in l.templateNames) {
        const dCard = document.getElementById(key);
        if (dCard) {
            const h3 = dCard.querySelector('h3'); if (h3) h3.innerText = l.templateNames[key];
            let pDesc = dCard.querySelector('.template-desc');
            if (!pDesc) {
                pDesc = document.createElement('p'); pDesc.className = "template-desc text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate leading-relaxed group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors pointer-events-none";
                dCard.querySelector('.flex-1').appendChild(pDesc);
            }
            if (l.templateDescs && l.templateDescs[key]) pDesc.innerText = l.templateDescs[key];
        }
        const mBtn = document.getElementById(`mobile-${key}`);
        if (mBtn) {
             const ls = mBtn.querySelector('span:not(.icon-wrap)');
             if (ls) ls.innerText = l.templateNames[key]; else mBtn.innerText = l.templateNames[key];
        }
    }
    
    document.getElementById('customizeStudioTitle').innerText = l.customizeStudio;
    document.getElementById('tabLabel-content').innerText = currentLang === 'my' ? '📝 အချက်အလက်' : '📝 Content';
    document.getElementById('tabLabel-magic').innerText = currentLang === 'my' ? '✨ အထူးပြုလုပ်ချက်' : '✨ Magic Effects';
    
    document.getElementById('moodPresetsTitle').innerHTML = `<i class="fa-solid fa-palette text-indigo-500 mr-1.5"></i> ${l.moodPresets}`;
    document.getElementById('preloadedTracksTitle').innerHTML = `<i class="fa-solid fa-headphones text-indigo-500 mr-1.5"></i> ${l.preloadedTracks}`;
    document.getElementById('particlesTitleLabel').innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-indigo-500 mr-1.5"></i> ${l.particlesTitle}`;
    
    document.getElementById('preset-romantic').innerText = l.presets.romantic;
    document.getElementById('preset-gold').innerText = l.presets.gold;
    document.getElementById('preset-forest').innerText = l.presets.forest;
    document.getElementById('preset-sunset').innerText = l.presets.sunset;
    document.getElementById('preset-lavender').innerText = l.presets.lavender;
    
    document.getElementById('track-choose').innerText = l.tracks.choose;
    document.getElementById('track-guitar').innerText = l.tracks.guitar;
    document.getElementById('track-piano').innerText = l.tracks.piano;
    document.getElementById('track-lofi').innerText = l.tracks.lofi;
    document.getElementById('track-doc').innerText = l.tracks.waltz;
    document.getElementById('track-bday').innerText = l.tracks.birthday;
    
    document.getElementById('particle-choose').innerText = l.particles.choose;
    document.getElementById('particle-hearts').innerText = l.particles.hearts;
    document.getElementById('particle-sparkles').innerText = l.particles.sparkles;
    document.getElementById('particle-sakura').innerText = l.particles.sakura;
    document.getElementById('particle-snow').innerText = l.particles.snow;
    document.getElementById('particle-balloons').innerText = l.particles.balloons;
    document.getElementById('particle-stars').innerText = l.particles.stars;
    document.getElementById('particle-clover').innerText = l.particles.clover;
    
    const btnSpan = document.getElementById('btn-text-generate'); if (btnSpan) btnSpan.innerText = l.generateBtn;
    const badge = document.querySelector('.lang-label'); if (badge) badge.innerText = currentLang.toUpperCase();
    const mobEditorSpan = document.getElementById('mobileTabBtn-editor')?.querySelector('span');
    const mobPreviewSpan = document.getElementById('mobileTabBtn-preview')?.querySelector('span');
    if (mobEditorSpan) mobEditorSpan.innerText = currentLang === 'my' ? "ပြင်ဆင်စတူဒီယို" : "Editor";
    if (mobPreviewSpan) mobPreviewSpan.innerText = currentLang === 'my' ? "အစမ်းကြည့်ရှုရန်" : "Live Preview";

    if (activeSchema) buildDynamicStudioForm(activeSchema);
}

function toggleLang() { currentLang = currentLang === 'my' ? 'en' : 'my'; localStorage.setItem('lang', currentLang); applyLocalization(); }
function openIframeInNewTab() {
    const cs = document.getElementById('previewIframe').src;
    if (cs && cs !== 'about:blank' && !cs.includes('example.html')) window.open(cs, '_blank');
    else alert(currentLang === 'my' ? "ဖွင့်ရန် အစမ်းကြည့်ရှုမှုစနစ် (Layout) တစ်ခုခုအား ဦးစွာ ရွေးချယ်ပေးပါရန် လိုအပ်ပါသည်။" : "Please select and activate a layout design template first.");
}

function switchStudioTab(tabId) {
    activeStudioTab = tabId;
    const cTab = document.getElementById('tabBtn-content'); const mTab = document.getElementById('tabBtn-magic');
    const cPanel = document.getElementById('tabPanel-content'); const mPanel = document.getElementById('tabPanel-magic');
    const activeClass = "flex-1 py-2.5 rounded-xl text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-[0_4px_12px_rgba(99,102,241,0.08)] border border-slate-200/60 dark:border-slate-800/60 focus:outline-none transition-all duration-300 font-sans";
    const inactiveClass = "flex-1 py-2.5 rounded-xl text-center text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-all duration-300 font-sans";
    
    if (tabId === 'content') {
        cTab.className = activeClass; mTab.className = inactiveClass;
        cPanel.classList.remove('hidden'); mPanel.classList.add('hidden');
    } else {
        mTab.className = activeClass; cTab.className = inactiveClass;
        mPanel.classList.remove('hidden'); cPanel.classList.add('hidden');
    }
}

function applyMoodPreset(themeName) {
    if (!activeSchema) return; const colors = presetColors[themeName]; if (!colors) return;
    activeSchema.forEach(field => {
        if (field.type === 'color') {
            const id = field.id.toLowerCase(); const label = field.label.toLowerCase(); let cc = colors.secondary;
            if (id.includes('bg') || id.includes('background') || label.includes('bg') || id.includes('colorbg') || id.includes('bg_color')) cc = colors.bg;
            else if (id.includes('text') || label.includes('text') || id.includes('font') || id.includes('colortext')) cc = colors.text;
            else if (id.includes('envelope') || id.includes('card') || label.includes('envelope') || id.includes('primary') || id.includes('colorflap')) cc = colors.primary;
            updateStateAndSync(field.id, cc);
        }
    });
    buildDynamicStudioForm(activeSchema);
}

function applyPreloadedTrack(url) {
    if (!url || !activeSchema) return;
    activeSchema.forEach(field => {
        if (field.type === 'audio' || field.id.toLowerCase().includes('music') || field.id.toLowerCase().includes('track')) {
            updateStateAndSync(field.id, url);
        }
    });
    buildDynamicStudioForm(activeSchema);
    const lp = document.getElementById('localDemoPlayer'); lp.src = url; if (isLocalMusicPlaying) lp.play();
}

function toggleLocalTrackPlayer() {
    const player = document.getElementById('localDemoPlayer'); const select = document.getElementById('preloadedTracksSelect');
    const btn = document.getElementById('previewTrackPlayBtn'); const visualizer = document.getElementById('waveVisualizer');
    const vt = document.getElementById('visualizer-text');
    if (!select.value) { alert(currentLang === 'my' ? "ဦးစွာ တေးသီချင်းတစ်ပုဒ် ရွေးချယ်ပေးပါ။" : "Please select a soundtrack first."); return; }
    if (isLocalMusicPlaying) {
        player.pause(); btn.innerHTML = `<i class="fa-solid fa-play text-xs"></i>`; isLocalMusicPlaying = false;
        if (visualizer) { visualizer.classList.add('hidden'); visualizer.classList.remove('flex'); }
    } else {
        player.src = select.value; player.play().then(() => {
            btn.innerHTML = `<i class="fa-solid fa-pause text-xs animate-pulse"></i>`; isLocalMusicPlaying = true;
            if (visualizer) { visualizer.classList.remove('hidden'); visualizer.classList.add('flex', 'animate-in', 'fade-in', 'duration-300'); }
            if (vt) vt.innerText = currentLang === 'my' ? "အစမ်း တေးဂီတ ဖွင့်နေသည်" : "Audio Preview Playing";
        }).catch(err => { alert(currentLang === 'my' ? "အစမ်းဖွင့်ရန် အဆင်မပြေပါ။" : "Unable to play preview."); });
    }
}

function applyParticleCustomizer(symbol) {
    if (!symbol || !activeSchema) return;
    activeSchema.forEach(field => {
        const id = field.id.toLowerCase(); const label = field.label.toLowerCase();
        if (id.includes('emoji') || id.includes('icon') || id.includes('particle') || id.includes('wax') || label.includes('emoji')) {
            updateStateAndSync(field.id, symbol);
        }
    });
    buildDynamicStudioForm(activeSchema);
}

function buildDynamicStudioForm(schema) {
    const l = locales[currentLang]; const container = document.getElementById('dynamicFormContainer'); container.innerHTML = '';
    const groups = {
        texts: { title: currentLang === 'my' ? "စာသားနှင့် ရေးသားချက်များ" : "Texts & Messages", icon: "fa-file-signature text-amber-500", elements: [] },
        visuals: { title: currentLang === 'my' ? "ပုံရိပ်နှင့် တန်ဆာဆင်မှု" : "Visuals & Embellishments", icon: "fa-photo-film text-indigo-500", elements: [] },
        colors: { title: currentLang === 'my' ? "အရောင်နှင့် ပါတ်ဝန်းကျင်" : "Colors & Theme", icon: "fa-sliders text-rose-500", elements: [] }
    };
    
    schema.forEach(field => {
        const id = field.id.toLowerCase(); const label = field.label.toLowerCase(); let cat = 'texts';
        if (field.type === 'color' || id.includes('bg') || id.includes('color') || id.includes('music') || id.includes('track') || label.includes('color') || label.includes('music')) {
            cat = 'colors';
        } else if (field.type === 'image' || field.type === 'file' || id.includes('emoji') || id.includes('icon') || id.includes('banner') || id.includes('photo') || id.includes('wax') || id.includes('decor') || label.includes('emoji') || label.includes('photo')) {
            cat = 'visuals';
        }
        groups[cat].elements.push(field);
        if (stateDataStorage[field.id] === undefined) stateDataStorage[field.id] = field.defaultValue || '';
    });
    
    for (let catId in groups) {
        const grp = groups[catId]; if (grp.elements.length === 0) continue;
        const groupCard = document.createElement('div'); groupCard.className = "border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden font-sans";
        const grpHeader = document.createElement('button'); grpHeader.type = "button";
        grpHeader.className = "w-full px-3 py-2.5 flex items-center justify-between text-left font-bold text-xs bg-slate-100/50 dark:bg-slate-800/20 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border-b border-slate-100 dark:border-slate-800 transition-all select-none font-sans";
        grpHeader.innerHTML = `<div class="flex items-center gap-2"><i class="fa-solid ${grp.icon}"></i><span>${grp.title}</span></div><i class="fa-solid fa-chevron-down text-[9px] text-slate-400 group-arrow transition-transform"></i>`;
        
        const grpBody = document.createElement('div'); grpBody.className = "p-3 space-y-3.5 transition-all duration-300";
        grp.elements.forEach(field => {
            const wrapper = document.createElement('div'); wrapper.className = "space-y-1 font-sans";
            const labelText = l.labels[field.id] || field.label;
            wrapper.innerHTML = `<label class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">${labelText}</label>`;
            let input; const baseClass = "w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[10px] font-sans";
            
            if (field.type === 'image' || field.type === 'audio' || field.type === 'file') {
                const inputGroup = document.createElement('div'); inputGroup.className = "space-y-2";
                const dropZone = document.createElement('div');
                dropZone.className = "border border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 rounded-xl p-3.5 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/20 hover:bg-indigo-50/10 group relative flex flex-col items-center justify-center space-y-1 select-none active:scale-[0.98] font-sans";
                const currentVal = stateDataStorage[field.id];
                let activeText = currentLang === 'my' ? 'ဖိုင်ရွေးရန် နှိပ်ပါ သို့မဟုတ် ဆွဲထည့်ပါ' : 'Click or drag file here to upload';
                let isBlob = false;
                if (currentVal && currentVal.startsWith('blob:')) { activeText = `✓ File Loaded`; isBlob = true; }
                dropZone.innerHTML = `<div class="w-7 h-7 rounded-lg bg-indigo-50/10 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform"><i class="fa-solid ${field.type === 'audio' ? 'fa-music' : 'fa-image'} text-[11px]"></i></div><span class="text-[10px] font-semibold text-slate-700 dark:text-slate-300 pointer-events-none drop-label ${isBlob ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''} font-sans">${activeText}</span><span class="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest pointer-events-none font-sans">${field.type === 'audio' ? 'Max 5MB • Audio' : 'Max 2MB • Image'}</span>`;
                
                const hiddenFileInput = document.createElement('input'); hiddenFileInput.type = 'file'; hiddenFileInput.className = "hidden"; hiddenFileInput.accept = field.type === 'audio' ? "audio/*" : "image/*";
                dropZone.addEventListener('click', () => hiddenFileInput.click());
                dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-indigo-500', 'bg-indigo-500/5'); });
                dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/5'));
                
                const handleFileSelection = async (file) => {
                    if (file) {
                        const MAX_SIZE = field.type === 'audio' ? 5 : 2;
                        if (file.size > MAX_SIZE * 1024 * 1024) { alert(currentLang === 'my' ? `ဖိုင်အရွယ်အစား ကြီးမားနေပါသည်။ အများဆုံး ${MAX_SIZE}MB သာ ခွင့်ပြုပါသည်။` : `File too large. Max size is ${MAX_SIZE}MB.`); return; }
                        const dl = dropZone.querySelector('.drop-label'); dl.innerText = `✓ ${file.name.slice(0, 15)}...`;
                        dl.className = "text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none drop-label animate-pulse font-sans";
                        if (field.type === 'image') { try { file = await compressImage(file); } catch(ex) { console.error(ex); } }
                        pendingFiles[field.id] = file; updateStateAndSync(field.id, URL.createObjectURL(file)); urlInput.value = '';
                    }
                };
                dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/5'); handleFileSelection(e.dataTransfer.files[0]); });
                hiddenFileInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));
                
                const urlInput = document.createElement('input'); urlInput.type = 'text'; urlInput.placeholder = currentLang === 'my' ? "သို့မဟုတ် တိုက်ရိုက် လင့်ခ် (URL) ထည့်ပါ..." : "Or paste direct URL link here...";
                urlInput.className = baseClass; urlInput.value = stateDataStorage[field.id] && !stateDataStorage[field.id].startsWith('blob:') ? stateDataStorage[field.id] : '';
                urlInput.addEventListener('input', e => {
                    if (e.target.value.trim() !== '') {
                        delete pendingFiles[field.id]; updateStateAndSync(field.id, e.target.value); hiddenFileInput.value = '';
                        const dl = dropZone.querySelector('.drop-label'); dl.innerText = currentLang === 'my' ? 'ဖိုင်ရွေးရန် နှိပ်ပါ သို့မဟုတ် ဆွဲထည့်ပါ' : 'Click/Drag file';
                        dl.className = "text-[10px] font-semibold text-slate-700 dark:text-slate-300 pointer-events-none drop-label font-sans";
                    }
                });
                inputGroup.appendChild(dropZone); inputGroup.appendChild(hiddenFileInput); inputGroup.appendChild(urlInput); input = inputGroup;
            } else if (field.type === 'select') {
                input = document.createElement('select'); input.className = baseClass;
                if (field.options) {
                    field.options.forEach(opt => {
                        const o = document.createElement('option'); o.value = typeof opt === 'object' ? opt.value : opt; o.innerText = typeof opt === 'object' ? opt.label : opt; input.appendChild(o);
                    });
                }
                input.value = stateDataStorage[field.id] || field.defaultValue || '';
                input.addEventListener('change', e => updateStateAndSync(field.id, e.target.value));
            } else if (field.type === 'textarea') {
                input = document.createElement('textarea'); input.className = baseClass + " resize-none"; input.rows = 4; input.value = stateDataStorage[field.id] || field.defaultValue || '';
                input.addEventListener('input', e => updateStateAndSync(field.id, e.target.value));
            } else if (field.type === 'color') {
                input = document.createElement('input'); input.type = 'color'; input.className = "w-full h-10 p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer";
                input.value = stateDataStorage[field.id] || field.defaultValue || '#000000';
                input.addEventListener('input', e => updateStateAndSync(field.id, e.target.value));
            } else {
                input = document.createElement('input'); input.type = field.type || 'text'; input.className = baseClass; input.value = stateDataStorage[field.id] || field.defaultValue || '';
                input.addEventListener('input', e => updateStateAndSync(field.id, e.target.value));
            }
            wrapper.appendChild(input); grpBody.appendChild(wrapper);
        });
        grpHeader.addEventListener('click', () => {
            const arrow = grpHeader.querySelector('.group-arrow');
            if (grpBody.classList.contains('hidden')) { grpBody.classList.remove('hidden'); arrow.style.transform = "rotate(0deg)"; }
            else { grpBody.classList.add('hidden'); arrow.style.transform = "rotate(-90deg)"; }
        });
        groupCard.appendChild(grpHeader); groupCard.appendChild(grpBody); container.appendChild(groupCard);
    }
    dispatchDataToIframe();
}

function triggerSuccessConfetti() {
    const cc = 85; const colors = ['#ff758f', '#ff8fab', '#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];
    for (let i = 0; i < cc; i++) {
        const conf = document.createElement('div'); conf.className = "fixed pointer-events-none z-[9999] transition-all duration-1000 ease-out";
        const size = Math.random() * 8 + 6; conf.style.width = size + 'px'; conf.style.height = size * (Math.random() > 0.5 ? 2 : 1) + 'px';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]; conf.style.left = Math.random() * 100 + 'vw'; conf.style.top = '-20px';
        conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'; conf.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(conf);
        const dur = Math.random() * 1800 + 1600; const fl = (parseFloat(conf.style.left) + (Math.random() * 24 - 12)) + 'vw'; const ft = '105vh'; const fr = Math.random() * 720;
        setTimeout(() => {
            conf.style.transition = `left ${dur}ms ease-out, top ${dur}ms cubic-bezier(0.1, 0.8, 0.3, 1), transform ${dur}ms ease-out`;
            conf.style.left = fl; conf.style.top = ft; conf.style.transform = `rotate(${fr}deg)`;
        }, 20);
        setTimeout(() => conf.remove(), dur + 100);
    }
}

function updateStateAndSync(key, value) { stateDataStorage[key] = value; dispatchDataToIframe(); }
function dispatchDataToIframe() {
    const iframe = document.getElementById('previewIframe');
    if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'UPDATE_DATA', payload: stateDataStorage }, '*');
}

async function generateVercelNativeRouteLink() {
    const btn = document.getElementById('deployBtn'); const btnSpan = document.getElementById('btn-text-generate');
    btn.disabled = true; btnSpan.innerText = locales[currentLang].generatingBtn;
    try {
        const formData = new FormData(); const cleanState = { ...stateDataStorage };
        for (let k in cleanState) if (typeof cleanState[k] === 'string' && cleanState[k].startsWith('blob:')) delete cleanState[k];
        cleanState.templateName = activeSelectedFile.replace('.html', '');
        formData.append('payload', JSON.stringify(cleanState));
        for (let k in pendingFiles) formData.append(k, pendingFiles[k]);
        
        const res = await fetch('/api/generate-card', { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            const fullUrl = window.location.origin + '/view/' + result.id;
            document.getElementById('generatedLinkInput').value = fullUrl;
            document.getElementById('qrcodeCanvas').innerHTML = '';
            const isMobile = window.innerWidth < 768;
            qrCodeInstance = new QRCodeStyling({
                width: isMobile ? 220 : 280, height: isMobile ? 220 : 280, data: fullUrl,
                dotsOptions: { color: "#4f46e5", type: "extra-rounded" },
                backgroundOptions: { color: "#ffffff" },
                cornersSquareOptions: { type: "extra-rounded", color: "#4f46e5" },
                cornersDotOptions: { type: "dot", color: "#4f46e5" },
                imageOptions: { crossOrigin: "anonymous", margin: 8 }
            });
            qrCodeInstance.append(document.getElementById('qrcodeCanvas'));
            setQRModalMobileTab('preview');
            document.getElementById('qrModal').classList.remove('hidden');
            setTimeout(() => renderLovePoster(), 100);
            setTimeout(() => renderLovePoster(), 400);
            setTimeout(() => renderLovePoster(), 850);
            triggerSuccessConfetti();
        } else {
            alert(result.message);
        }
    } catch(e) {
        console.error(e); alert("Failed to connect to server.");
    } finally {
        btn.disabled = false; btnSpan.innerText = locales[currentLang].generateBtn;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    else { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
}

applyLocalization();
syncResponsiveLayout();
window.addEventListener('resize', syncResponsiveLayout);

function enterStudio() {
    document.body.classList.remove('landing-active');
    switchTemplateFile('lovecard.html', 'btn-index');
    syncResponsiveLayout();
}
window.enterStudio = enterStudio;

window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'REGISTER_MANIFEST') {
        activeSchema = event.data.schema; buildDynamicStudioForm(event.data.schema);
    } else if (event.data && event.data.type === 'START_STUDIO') {
        enterStudio();
    } else if (event.data && event.data.type === 'SELECT_TEMPLATE') {
        document.body.classList.remove('landing-active');
        switchTemplateFile(event.data.fileName, event.data.cardId);
        syncResponsiveLayout();
    }
});

async function checkDatabaseStatus() {
    try {
        const res = await fetch('/api/db-status');
        const data = await res.json();
        
        // MongoDB Badge
        const dbBadge = document.getElementById('db-connection-badge');
        if (dbBadge) {
            if (data.connected) {
                dbBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> MongoDB Live`;
                dbBadge.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 select-none animate-pulse";
            } else {
                if (data.envConfigured) {
                    dbBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Mongo Issue`;
                    dbBadge.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 select-none";
                } else {
                    dbBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Local fallback JSON`;
                    dbBadge.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 select-none";
                }
            }
        }

        // Cloudinary Badge
        const cldBadge = document.getElementById('cloudinary-connection-badge');
        if (cldBadge) {
            if (data.cloudinaryConfigured) {
                cldBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloudinary Cloud`;
                cldBadge.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 select-none animate-pulse";
            } else {
                if (data.cloudinaryEnvConfigured) {
                    cldBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Cloudinary Connect Issue`;
                    cldBadge.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 select-none";
                } else {
                    cldBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Local folder uploads`;
                    cldBadge.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 select-none";
                }
            }
        }
    } catch (e) {
        console.error("Failed to check database and media status", e);
    }
}
setTimeout(checkDatabaseStatus, 1000);
setInterval(checkDatabaseStatus, 15000);

