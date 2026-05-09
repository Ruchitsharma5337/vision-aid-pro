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
const colorPlates = [
  { number: '12', bg: '#e89c54', fg: '#7fb069' },  // easy demo
  { number: '8',  bg: '#d96a4a', fg: '#a3c585' },
  { number: '6',  bg: '#c45a3a', fg: '#94b86c' },
  { number: '29', bg: '#e5a05a', fg: '#6da265' },
  { number: '5',  bg: '#cc6f3c', fg: '#9bbf78' },
  { number: '3',  bg: '#d97a45', fg: '#85b06d' },
  { number: '15', bg: '#c66838', fg: '#9ec47e' },
  { number: '74', bg: '#e09660', fg: '#7aa863' },
  { number: '2',  bg: '#cf7240', fg: '#92b975' },
  { number: '45', bg: '#d8884e', fg: '#83b06b' },
  { number: '7',  bg: '#c46235', fg: '#a0c984' },
  { number: '16', bg: '#dc8a55', fg: '#88b46f' },
  { number: '42', bg: '#e09a5e', fg: '#79a662' },
  { number: '9',  bg: '#cb6e3b', fg: '#9bc079' },
  { number: '8',  bg: '#d77e48', fg: '#8db374' }
];

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
