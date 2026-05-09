/* =========================================================
   Visual Acuity Analysis & Compensation
   Developed by Ruchit Sharma
   Simple, beginner-friendly JavaScript
   ========================================================= */

/* ---------------- LOADER ---------------- */
// Hide loader when page is fully loaded
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
  }
});

/* ---------------- DARK / LIGHT MODE ---------------- */
// Toggle theme and remember choice in localStorage
function initTheme() {
  const saved = localStorage.getItem('vaac-theme');
  if (saved === 'dark') document.body.classList.add('dark');
  updateThemeIcon();
}
function toggleTheme() {
  document.body.classList.toggle('dark');
  const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('vaac-theme', mode);
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

/* ---------------- MOBILE MENU ---------------- */
function toggleMenu() {
  document.querySelector('.nav-links')?.classList.toggle('open');
}

/* ---------------- VISION TEST DATA ---------------- */
// 15 questions: letters, numbers, shapes, mixed
// Contrast and size decrease gradually (handled in render)
const visionQuestions = [
  { stimulus: 'E',     options: ['E','F','B','P'], answer: 'E', type: 'letter' },
  { stimulus: '7',     options: ['1','7','9','4'], answer: '7', type: 'number' },
  { stimulus: '▲',     options: ['●','▲','■','◆'], answer: '▲', type: 'shape' },
  { stimulus: 'A',     options: ['A','H','N','M'], answer: 'A', type: 'letter' },
  { stimulus: '3',     options: ['8','5','3','9'], answer: '3', type: 'number' },
  { stimulus: '■',     options: ['■','▲','●','◆'], answer: '■', type: 'shape' },
  { stimulus: 'R',     options: ['P','B','R','K'], answer: 'R', type: 'letter' },
  { stimulus: '5',     options: ['6','3','8','5'], answer: '5', type: 'number' },
  { stimulus: '●',     options: ['◆','●','▲','■'], answer: '●', type: 'shape' },
  { stimulus: 'C2',    options: ['C2','G2','O2','C7'], answer: 'C2', type: 'mixed' },
  { stimulus: 'L',     options: ['I','L','T','J'], answer: 'L', type: 'letter' },
  { stimulus: '9',     options: ['9','6','0','8'], answer: '9', type: 'number' },
  { stimulus: '◆',     options: ['◆','■','●','▲'], answer: '◆', type: 'shape' },
  { stimulus: 'H8',    options: ['M8','H8','H6','N3'], answer: 'H8', type: 'mixed' },
  { stimulus: 'Z',     options: ['N','Z','S','X'], answer: 'Z', type: 'letter' }
];

/* ---------------- COLOR BLINDNESS DATA ---------------- */
// Each plate uses a number drawn over a colored background.
// Colors are picked to mimic Ishihara red/green confusion.
// Each plate: hidden number (figure), background color theme, foreground theme.
// Themes: 'rg' = red figure on green dots (classic red-green Ishihara).
//         'gr' = green figure on red dots.
//         'by' = blue figure on yellow/orange dots.
const colorPlates = [
  { number: '12', theme: 'rg' },
  { number: '8',  theme: 'gr' },
  { number: '6',  theme: 'rg' },
  { number: '29', theme: 'gr' },
  { number: '5',  theme: 'rg' },
  { number: '3',  theme: 'by' },
  { number: '15', theme: 'gr' },
  { number: '74', theme: 'rg' },
  { number: '2',  theme: 'gr' },
  { number: '45', theme: 'rg' },
  { number: '7',  theme: 'by' },
  { number: '16', theme: 'gr' },
  { number: '42', theme: 'rg' },
  { number: '9',  theme: 'gr' },
  { number: '8',  theme: 'rg' }
];

/* Draw a realistic Ishihara-style plate using random circles.
   - We render the target number onto an offscreen canvas, then use the
     pixel mask to color dots that fall on the number with the "figure"
     palette and dots outside with the "background" palette. */
function drawIshiharaPlate(plate) {
  const canvas = document.getElementById('ishiharaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, R = W / 2;

  // Color palettes (figure / background)
  const palettes = {
    rg: { fig: ['#c0392b','#a93226','#922b21','#cb4335','#e74c3c'],
          bg:  ['#7fb069','#9bc28b','#b5cda3','#d9c97a','#e6c66b'] },
    gr: { fig: ['#27ae60','#2ecc71','#52be80','#7dcea0','#48c9b0'],
          bg:  ['#d35400','#e67e22','#dc7633','#e59866','#f0b27a'] },
    by: { fig: ['#1f6dad','#2874a6','#2e86c1','#3498db','#5dade2'],
          bg:  ['#e6b34a','#f1c40f','#e59866','#dc7633','#d4ac0d'] }
  };
  const pal = palettes[plate.theme] || palettes.rg;

  // 1) Build a mask of where the number is
  const mask = document.createElement('canvas');
  mask.width = W; mask.height = H;
  const mctx = mask.getContext('2d');
  mctx.fillStyle = '#000';
  mctx.fillRect(0, 0, W, H);
  mctx.fillStyle = '#fff';
  mctx.font = 'bold 200px Arial, sans-serif';
  mctx.textAlign = 'center';
  mctx.textBaseline = 'middle';
  mctx.fillText(plate.number, W / 2, H / 2 + 6);
  const maskData = mctx.getImageData(0, 0, W, H).data;

  // 2) Clear plate canvas
  ctx.clearRect(0, 0, W, H);

  // 3) Draw many random circles inside the plate disc
  const dotCount = 1400;
  for (let i = 0; i < dotCount; i++) {
    // Random point inside circle (rejection sampling)
    let x, y, dx, dy;
    do {
      x = Math.random() * W;
      y = Math.random() * H;
      dx = x - R; dy = y - R;
    } while (dx * dx + dy * dy > (R - 4) * (R - 4));

    // Random radius (bigger dots more common, small dots fill gaps)
    const r = 2 + Math.random() * Math.random() * 9;

    // Look up mask
    const idx = ((y | 0) * W + (x | 0)) * 4;
    const onFigure = maskData[idx] > 128;

    const colors = onFigure ? pal.fig : pal.bg;
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------------- TEST ENGINE (shared) ---------------- */
let currentQ = 0;
let answers = [];
let timerInterval;
let secondsLeft = 0;
let activeTest = null; // 'vision' or 'color'

function startTest(type) {
  activeTest = type;
  const name = document.getElementById('userName').value.trim();
  if (!name) { alert('Please enter your name to start.'); return; }
  localStorage.setItem('vaac-username', name);

  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('testScreen').style.display = 'block';

  currentQ = 0;
  answers = new Array(getQuestions().length).fill(null);
  secondsLeft = 0;
  startTimer();
  renderQuestion();
}

function getQuestions() {
  return activeTest === 'vision' ? visionQuestions : colorPlates;
}

function startTimer() {
  const el = document.getElementById('timer');
  timerInterval = setInterval(() => {
    secondsLeft++;
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    el.textContent = `⏱ ${m}:${s}`;
  }, 1000);
}

function renderQuestion() {
  const total = getQuestions().length;
  const q = getQuestions()[currentQ];

  // Update progress bar
  document.getElementById('progressFill').style.width = ((currentQ + 1) / total * 100) + '%';
  document.getElementById('qCounter').textContent = `Question ${currentQ + 1} / ${total}`;

  const box = document.getElementById('questionBox');

  if (activeTest === 'vision') {
    // Strong, visible decrease in size + brightness/contrast as user progresses
    const size = Math.max(22, 200 - currentQ * 12);          // 200px -> 32px
    const opacity = Math.max(0.18, 1 - currentQ * 0.06);     // 1.0 -> ~0.18
    const brightness = Math.max(0.35, 1 - currentQ * 0.045); // 1.0 -> ~0.36
    const contrast = Math.max(0.45, 1 - currentQ * 0.035);   // 1.0 -> ~0.49
    const blur = Math.min(1.6, currentQ * 0.1);              // 0 -> ~1.4px
    box.innerHTML = `
      <div class="stimulus-frame">
        <div class="question-stimulus"
             style="font-size:${size}px; opacity:${opacity};
                    filter: brightness(${brightness}) contrast(${contrast}) blur(${blur}px);">
          ${q.stimulus}
        </div>
        <span class="size-hint">Size: ${size}px • Contrast: ${Math.round(contrast*100)}%</span>
      </div>
      <p style="color:var(--muted)">Select what you see:</p>
      <div class="options">
        ${q.options.map(opt => `
          <button class="option-btn ${answers[currentQ] === opt ? 'selected' : ''}"
                  onclick="selectAnswer('${opt}')">${opt}</button>
        `).join('')}
      </div>`;
  } else {
    // Realistic Ishihara dot plate rendered on canvas
    box.innerHTML = `
      <canvas id="ishiharaCanvas" width="360" height="360" class="ishihara-canvas"></canvas>
      <p style="color:var(--muted)">Type the number you see (leave blank if none):</p>
      <input type="text" class="name-input" id="plateAnswer"
             style="max-width:220px;margin:10px auto;display:block;text-align:center"
             placeholder="Type what you see"
             value="${answers[currentQ] || ''}"
             oninput="answers[${currentQ}] = this.value.trim()" />`;
    drawIshiharaPlate(q);
  }

  document.getElementById('prevBtn').disabled = currentQ === 0;
  document.getElementById('nextBtn').textContent =
    currentQ === total - 1 ? 'Finish ✓' : 'Next →';
}

function selectAnswer(opt) {
  answers[currentQ] = opt;
  renderQuestion();
}

function nextQuestion() {
  const total = getQuestions().length;
  if (currentQ < total - 1) {
    currentQ++;
    renderQuestion();
  } else {
    finishTest();
  }
}
function prevQuestion() {
  if (currentQ > 0) { currentQ--; renderQuestion(); }
}

/* ---------------- SCORING ---------------- */
function finishTest() {
  clearInterval(timerInterval);
  const qs = getQuestions();
  let correct = 0;
  qs.forEach((q, i) => {
    const ans = (answers[i] || '').toString().trim();
    const expected = activeTest === 'vision' ? q.answer : q.number;
    if (ans.toLowerCase() === expected.toLowerCase()) correct++;
  });

  const total = qs.length;
  const percent = Math.round((correct / total) * 100);
  const name = localStorage.getItem('vaac-username') || 'User';

  // Result message
  let title, msg, cls, suggestion;
  if (activeTest === 'vision') {
    if (correct >= 12) {
      title = 'Your Eyes Are Good';
      msg = 'Normal Vision Detected';
      cls = 'result-good';
      suggestion = 'Keep up healthy habits — take screen breaks every 20 minutes.';
    } else {
      title = 'You Need Eye Consultation';
      msg = 'Possible Vision Weakness Detected';
      cls = 'result-bad';
      suggestion = 'We recommend visiting an optometrist for a detailed check-up.';
    }
  } else {
    if (correct >= 11) {
      title = 'Normal Color Vision';
      msg = 'You can perceive colors correctly.';
      cls = 'result-good';
      suggestion = 'Your color perception appears within normal range.';
    } else if (correct >= 7) {
      title = 'Partial Color Blindness';
      msg = 'Possible Mild Color Vision Deficiency';
      cls = 'result-bad';
      suggestion = 'Consider an Ishihara test with an eye specialist.';
    } else {
      title = 'Possible Color Vision Deficiency';
      msg = 'Red-Green Color Blindness pattern detected';
      cls = 'result-bad';
      suggestion = 'A professional eye exam is strongly recommended.';
    }
  }

  // Save result history to localStorage
  const history = JSON.parse(localStorage.getItem('vaac-history') || '[]');
  history.push({
    name, type: activeTest, correct, total, percent,
    date: new Date().toLocaleString(), title
  });
  localStorage.setItem('vaac-history', JSON.stringify(history));

  // Show result
  document.getElementById('testScreen').style.display = 'none';
  const resScreen = document.getElementById('resultScreen');
  resScreen.style.display = 'block';
  resScreen.innerHTML = `
    <div class="result-card">
      <div class="score-circle" style="--val:${percent}">
        <span>${percent}%</span>
      </div>
      <h2 class="result-title ${cls}">${title}</h2>
      <p style="color:var(--muted)">${msg}</p>
      <hr style="margin:20px 0;border:none;border-top:1px solid var(--border)">
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Score:</strong> ${correct} / ${total}</p>
      <p><strong>Accuracy:</strong> ${percent}%</p>
      <p style="margin-top:14px;color:var(--muted)">💡 ${suggestion}</p>
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="downloadPDF('${name}','${title}',${correct},${total},${percent})">⬇ Download PDF</button>
        <button class="btn btn-outline" onclick="location.reload()">↻ Retake Test</button>
      </div>
    </div>`;
}

/* ---------------- PDF DOWNLOAD ---------------- */
// Uses jsPDF loaded from CDN in test pages
function downloadPDF(name, title, correct, total, percent) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(30, 109, 255);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Visual Acuity Analysis & Compensation', 14, 20);

  doc.setTextColor(11, 37, 69);
  doc.setFontSize(14);
  doc.text('Test Result Report', 14, 45);

  doc.setFontSize(12);
  doc.text(`Name: ${name}`, 14, 60);
  doc.text(`Test Type: ${activeTest === 'vision' ? 'Vision / Contrast Sensitivity' : 'Color Blindness'}`, 14, 70);
  doc.text(`Date: ${new Date().toLocaleString()}`, 14, 80);
  doc.text(`Score: ${correct} / ${total}`, 14, 90);
  doc.text(`Accuracy: ${percent}%`, 14, 100);
  doc.text(`Result: ${title}`, 14, 110);

  doc.setTextColor(91, 107, 135);
  doc.setFontSize(10);
  doc.text('Developed by Ruchit Sharma', 14, 280);

  doc.save(`VAAC_Result_${name}.pdf`);
}

/* ---------------- CONTACT FORM VALIDATION ---------------- */
function validateContact(e) {
  e.preventDefault();
  let ok = true;
  const name = document.getElementById('cName');
  const email = document.getElementById('cEmail');
  const msg = document.getElementById('cMsg');

  // Reset errors
  document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');

  if (!name.value.trim()) { showError('eName'); ok = false; }
  if (!/^\S+@\S+\.\S+$/.test(email.value)) { showError('eEmail'); ok = false; }
  if (msg.value.trim().length < 10) { showError('eMsg'); ok = false; }

  if (ok) {
    document.getElementById('contactSuccess').style.display = 'block';
    e.target.reset();
    setTimeout(() => document.getElementById('contactSuccess').style.display = 'none', 4000);
  }
  return false;
}
function showError(id) { document.getElementById(id).style.display = 'block'; }

/* ---------------- INITIAL ---------------- */
document.addEventListener('DOMContentLoaded', initTheme);
