const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download');
const statusEl = document.getElementById('status');
const headInput = document.getElementById('headInput');
const upperInput = document.getElementById('upperInput');
const judulInput = document.getElementById('judulInput');
const subjudulInput = document.getElementById('subjudulInput');
const kreditInput = document.getElementById('kreditInput');
const rubrikColor = document.getElementById('rubrikColor');
const judulColor = document.getElementById('judulColor');
const kreditColor = document.getElementById('kreditColor');
const invertJawapos = document.getElementById('invertJawapos');
const invertMedsos = document.getElementById('invertMedsos');
const textGroupSlider = document.getElementById('textGroupSlider');
const zoomSlider = document.getElementById('zoomSlider');
const fadeSelect = document.getElementById('fadeSelect');
const fadeSlider = document.getElementById('fadeSlider');
const upperUseBlock = document.getElementById('upperUseBlock');

const SPACE_AFTER_RUBRIK = 25;
const SPACE_AFTER_UPPER = 65;
const SPACE_AFTER_JUDUL = 10;

let img = null;
let headText = '';
let judulText = '';
let subjudulText = '';
let kreditText = '';
let textGroupOffset = 0;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false,
    lastX = 0,
    lastY = 0;

// Logo
const logoKiriBawah = new Image();
logoKiriBawah.src = "assets/logo-jawapos-biru.svg";

const logoKananAtas = new Image();
logoKananAtas.src = "assets/logo-jawapos-putih.svg";

const medsosLogo = new Image();
medsosLogo.src = "assets/logo-medsos.svg";


function setStatus(t) {
    statusEl.textContent = 'Status: ' + t;
}

function drawWrappedTextMulti(text, x, y, maxWidth, lineHeight, font, color, hScale = 1) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.scale(hScale, 1);
    const paragraphs = String(text || '').split(/\n/);
    let currentY = y;
    for (let p = 0; p < paragraphs.length; p++) {
        const words = paragraphs[p].split(/\s+/);
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let test = line + words[n] + ' ';
            let w = ctx.measureText(test).width;
            if (w > maxWidth / hScale && n > 0) {
                ctx.fillText(line.trim(), x / hScale, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = test;
            }
        }
        if (line.trim() !== '') {
            ctx.fillText(line.trim(), x / hScale, currentY);
            currentY += lineHeight;
        }
    }
    ctx.restore();
    return currentY;
}

function drawTextWithShrinkWrapBackground(text, x, y, maxWidth, lineHeight, font, textColor, bgColor, paddingH, paddingV, borderRadius) {
    ctx.save();
    ctx.font = font;
    const lines = [];

    const paragraphs = String(text || '').split(/\n/);
    for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/);
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine.trim());
    }

    const fontMetrics = ctx.measureText('M');
    const fontAscent = fontMetrics.actualBoundingBoxAscent;
    const fontHeight = fontAscent + fontMetrics.actualBoundingBoxDescent;

    ctx.fillStyle = bgColor;
    let drawY = y;
    for (const line of lines) {
        if (line) {
            const lineWidth = ctx.measureText(line).width;
            const blockX = x;
            const blockY = drawY - fontAscent - paddingV;
            const blockWidth = lineWidth + paddingH * 2;
            const blockHeight = fontHeight + paddingV * 2;

            ctx.beginPath();
            ctx.roundRect(blockX, blockY, blockWidth, blockHeight, borderRadius);
            ctx.fill();

            drawY += lineHeight;
        }
    }

    ctx.fillStyle = textColor;
    drawY = y;
    for (const line of lines) {
        if (line) {
            ctx.fillText(line, x + paddingH, drawY);
            drawY += lineHeight;
        }
    }

    ctx.restore();
    return drawY;
}


function drawImageWithAspect() {
    if (!img) {
        setStatus('Belum ada gambar.');
        return;
    }
    const targetWidth = canvas.width,
        targetHeight = canvas.height;
    ctx.fillStyle = "#FAF9F6";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Foto
    const iw = img.width,
        ih = img.height;
    const scale = Math.min(iw, ih);
    const dw = iw * zoom,
        dh = ih * zoom;
    const dx = (targetWidth - dw) / 2 + offsetX,
        dy = (targetHeight - dh) / 2 + offsetY;
    ctx.drawImage(img, dx, dy, dw, dh);

    // Fade
    const fadeMode = fadeSelect.value;
    const pos = parseInt(fadeSlider.value, 10);
    const fh = canvas.height * 0.25;
    if (fadeMode !== "none") {
        const isBlackFade = fadeMode.includes('black');
        const fadeColor = isBlackFade ? '#000000' : '#FAF9F6';
        const transparentColor = isBlackFade ? 'rgba(0,0,0,0)' : 'rgba(250,249,246,0)';

        if (fadeMode.includes("top")) {
            ctx.fillStyle = fadeColor;
            ctx.fillRect(0, 0, canvas.width, pos);
            const grad = ctx.createLinearGradient(0, pos, 0, pos + fh);
            grad.addColorStop(0, fadeColor);
            grad.addColorStop(1, transparentColor);
            ctx.fillStyle = grad;
            ctx.fillRect(0, pos, canvas.width, fh);
        } else if (fadeMode.includes("bottom")) {
            ctx.fillStyle = fadeColor;
            ctx.fillRect(0, canvas.height - pos, canvas.width, pos);
            const grad = ctx.createLinearGradient(0, canvas.height - pos - fh, 0, canvas.height - pos);
            grad.addColorStop(0, transparentColor);
            grad.addColorStop(1, fadeColor);
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height - pos - fh, canvas.width, fh);
        }
    }

    const margin = 170;
    let currentY = 780 + textGroupOffset;

    // Gambar Rubrik
    if (headInput.value) {
        ctx.font = 'bold 24pt "Proxima Nova Custom", san-serif';
        ctx.fillStyle = rubrikColor.value;
        ctx.fillText(headInput.value, margin, currentY, targetWidth - 2 * margin);
        currentY += SPACE_AFTER_RUBRIK;
    }

    // Gambar Teks Atas Judul
    if (upperInput.value) {
        currentY += 20;
        if (upperUseBlock.checked) {
            currentY = drawTextWithShrinkWrapBackground(
                upperInput.value,
                margin, currentY, targetWidth - 2 * margin, 30,
                'bold 24pt "Proxima Nova Custom", sans-serif', '#FFFFFF',
                '#007CBC', 15, 8, 12
            );
        } else {
            currentY = drawWrappedTextMulti(
                upperInput.value,
                margin, currentY, targetWidth - 2 * margin, 30,
                'bold 24pt "Proxima Nova Custom", sans-serif', judulColor.value
            );
        }
    }

    // Gambar Judul Utama (Tetap menggunakan DM Serif Display)
    currentY += SPACE_AFTER_UPPER;
    let afterJudulY = drawWrappedTextMulti(
        judulInput.value || 'Judul',
        margin,
        currentY,
        canvas.width - 2 * margin,
        68,
        '56pt "DM Serif Display", serif',
        judulColor.value
    );

    // Gambar Subjudul
    if (subjudulInput.value) {
        let subjudulY = afterJudulY - 20;
        drawWrappedTextMulti(
            subjudulInput.value,
            margin,
            subjudulY,
            canvas.width - 2 * margin,
            34,
            '23pt "Proxima Nova Custom", sans-serif',
            judulColor.value,
            0.99
        );
    }

    if (logoKananAtas.complete && logoKananAtas.naturalWidth) {
        const drawW = 200;
        const scale = drawW / logoKananAtas.naturalWidth;
        const drawH = logoKananAtas.naturalHeight * scale;
        const posX = targetWidth - drawW - 50,
            posY = 50;
        ctx.save();
        if (invertJawapos.checked) ctx.filter = "invert(1)";
        ctx.drawImage(logoKananAtas, posX, posY, drawW, drawH);
        ctx.restore();
    }

    if (logoKiriBawah.complete && logoKiriBawah.naturalWidth) {
        const drawW = 100;
        const scale = drawW / logoKiriBawah.naturalWidth;
        const drawH = logoKiriBawah.naturalHeight * scale;
        ctx.drawImage(logoKiriBawah, 0, targetHeight - drawH, drawW, drawH);
    }

    if (medsosLogo.complete && medsosLogo.naturalWidth) {
        const maxW = targetWidth * 0.71;
        const scale = maxW / medsosLogo.naturalWidth;
        const drawW = medsosLogo.naturalWidth * scale;
        const drawH = medsosLogo.naturalHeight * scale;
        const posX = (targetWidth - drawW) / 2;
        const posY = targetHeight - drawH - 165;
        ctx.save();
        if (invertMedsos.checked) ctx.filter = "invert(1)";
        ctx.drawImage(medsosLogo, posX, posY, drawW, drawH);
        ctx.restore();
    }

    if (kreditInput.value) {
        ctx.fillStyle = kreditColor.value;
        ctx.font = 'bold 18px "Proxima Nova Custom", san-serif';
        ctx.textBaseline = 'bottom';
        const text = kreditInput.value;
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, targetWidth - 50 - textWidth, targetHeight - 49);
    }

    setStatus('Preview siap.');
}

function loadMainImageFromDataURL(dataUrl) {
    const newImg = new Image();
    newImg.onload = () => {
        img = newImg;
        setStatus('Gambar dimuat.');
        drawImageWithAspect();
    };
    newImg.onerror = () => {
        setStatus('Gagal memuat gambar.');
    };
    newImg.src = dataUrl;
}

upload.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
        setStatus('Tidak ada file');
        return;
    }
    const reader = new FileReader();
    reader.onload = ev => loadMainImageFromDataURL(ev.target.result);
    reader.readAsDataURL(file);
    setStatus('Memuat file...');
});

headInput.addEventListener('input', () => {
    drawImageWithAspect();
});
upperInput.addEventListener('input', () => {
    drawImageWithAspect();
});
judulInput.addEventListener('input', () => {
    drawImageWithAspect();
});
subjudulInput.addEventListener('input', () => {
    drawImageWithAspect();
});
kreditInput.addEventListener('input', () => {
    drawImageWithAspect();
});
rubrikColor.addEventListener('change', () => {
    drawImageWithAspect();
});
judulColor.addEventListener('change', () => {
    drawImageWithAspect();
});
kreditColor.addEventListener('change', () => {
    drawImageWithAspect();
});
invertJawapos.addEventListener('change', () => {
    drawImageWithAspect();
});
invertMedsos.addEventListener('change', () => {
    drawImageWithAspect();
});
textGroupSlider.addEventListener('input', () => {
    textGroupOffset = parseInt(textGroupSlider.value, 10);
    drawImageWithAspect();
});
zoomSlider.addEventListener('input', () => {
    zoom = parseFloat(zoomSlider.value);
    drawImageWithAspect();
});
fadeSelect.addEventListener('change', () => {
    drawImageWithAspect();
});
fadeSlider.addEventListener('input', () => {
    drawImageWithAspect();
});
upperUseBlock.addEventListener('change', () => {
    drawImageWithAspect();
});

downloadBtn.addEventListener('click', () => {
    if (!img) {
        alert('Belum ada gambar.');
        return;
    }
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hasil-instagram.jpg';
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.92);
});

canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.classList.add('grabbing');
});
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX,
        dy = e.clientY - lastY;
    offsetX += dx;
    offsetY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    drawImageWithAspect();
});
window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.classList.remove('grabbing');
});
