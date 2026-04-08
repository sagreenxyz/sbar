'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sbar-form-data';

/**
 * Duration (ms) a toast is visible on screen.
 * Must align with the CSS animation: toast-in (0.25s) + display (2.5s) + toast-out (0.3s).
 */
const TOAST_DURATION_MS = 2800;

/** Required field IDs that must be non-empty before generating the report. */
const REQUIRED_FIELDS = [
  'currentDateTime',
  'admissionDateTime',
  'name',
  'age',
  'sex',
  'provider',
  'admissionDiagnosis',
  'allergies',
  'codeStatus',
  'nursesAssessment',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the trimmed value of a form element or empty string.
 * @param {string} id
 * @returns {string}
 */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/**
 * Append a row to an array only when the value is non-empty.
 * @param {Array} rows
 * @param {string} label
 * @param {string} value
 */
function addRow(rows, label, value) {
  if (value) rows.push({ label, value });
}

/**
 * Format current date/time as "Weekday HHMM".
 * @returns {string}
 */
function formatNow() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${days[now.getDay()]} ${hh}${mm}`;
}

// ── Toast notifications ───────────────────────────────────────────────────────

/**
 * Show a transient toast message.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='success']
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}

// ── Local-storage persistence ─────────────────────────────────────────────────

/** Collect all form field values into a plain object. */
function collectFormData() {
  const data = {};
  document.querySelectorAll('#sbarForm input, #sbarForm select, #sbarForm textarea').forEach((el) => {
    if (el.id) data[el.id] = el.value;
  });
  return data;
}

/** Restore form field values from a plain object. */
function restoreFormData(data) {
  Object.entries(data).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

/** Save form data to localStorage. */
function saveFormData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectFormData()));
    flashSaveIndicator();
  } catch {
    // Ignore quota errors silently
  }
}

/** Flash the "Saved" indicator in the action bar. */
let saveFlashTimer = null;
function flashSaveIndicator() {
  const el = document.getElementById('saveIndicator');
  if (!el) return;
  el.classList.add('visible');
  clearTimeout(saveFlashTimer);
  saveFlashTimer = setTimeout(() => el.classList.remove('visible'), 2000);
}

/** Load saved form data from localStorage on page load. */
function loadSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) restoreFormData(JSON.parse(raw));
  } catch {
    // Ignore parse errors
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate required fields. Mark invalid ones visually and return validity.
 * @returns {boolean}
 */
function validateForm() {
  let valid = true;
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.classList.add('invalid');
      valid = false;
    } else {
      el.classList.remove('invalid');
    }
  });
  return valid;
}

// ── Report: plain text (for clipboard) ───────────────────────────────────────

/**
 * Build a plain-text SBAR report from the current form values.
 * @returns {string}
 */
function buildReport() {
  const lines = [];
  const separator = '─'.repeat(60);

  // Header
  lines.push('SBAR HAND-OFF PATIENT REPORT');
  lines.push(separator);
  lines.push(`Current Date/Time  : ${val('currentDateTime')}`);
  lines.push(`Admission Date/Time: ${val('admissionDateTime')}`);
  lines.push('');

  // ── S – Situation
  lines.push('S — SITUATION');
  lines.push(separator);
  const addLine = (label, value) => { if (value) lines.push(`  ${label}: ${value}`); };
  addLine('Patient Name      ', val('name'));
  addLine('Age               ', val('age'));
  addLine('Sex               ', val('sex'));
  addLine('Ethnicity         ', val('ethnicity'));
  addLine('Religion          ', val('religion'));
  addLine('Provider          ', val('provider'));
  addLine('Admission Diagnosis', val('admissionDiagnosis'));
  lines.push('');

  // ── B – Background
  lines.push('B — BACKGROUND');
  lines.push(separator);
  addLine('Medical History   ', val('pertinentMedicalHistory'));
  addLine('Social History    ', val('pertinentSocialHistory'));
  addLine('Allergies         ', val('allergies'));
  addLine('Code Status       ', val('codeStatus'));
  lines.push('');

  // Vital Signs
  const vsFields = [
    ['vsTime', 'Time'],
    ['tempF', 'Temp (°F)'],
    ['tempC', 'Temp (°C)'],
    ['bloodPressure', 'Blood Pressure'],
    ['pulse', 'Pulse (bpm)'],
    ['respiratoryRate', 'Resp. Rate'],
    ['oxygenSaturation', 'O₂ Saturation (%)'],
  ];
  const vsRows = vsFields.map(([id, label]) => ({ label, value: val(id) })).filter((f) => f.value);
  if (vsRows.length) {
    lines.push('  Vital Signs:');
    vsRows.forEach((f) => addLine(`  ${f.label}`, f.value));
    lines.push('');
  }

  // Oxygen Therapy
  const oxyMode = val('oxygenMode'), oxyLPM = val('oxygenLPM');
  if (oxyMode || oxyLPM) {
    lines.push('  Oxygen Therapy:');
    addLine('  Mode           ', oxyMode);
    if (oxyLPM) addLine('  Liters/Minute  ', oxyLPM);
    lines.push('');
  }

  // Pain
  const painRating = val('painRating'), painMed = val('painMedication'), painTime = val('medicationTime');
  if (painRating || painMed || painTime) {
    lines.push('  Pain:');
    addLine('  Rating         ', painRating);
    addLine('  Last Medication', painMed);
    addLine('  Medication Time', painTime);
    lines.push('');
  }

  // Other Meds
  addLine('Other Medications ', val('otherRecentMedications'));
  if (val('otherRecentMedications')) lines.push('');

  // IV Access
  const ivSite = val('ivSite'), ivType = val('ivType'), ivAssessment = val('ivAssessment'), ivFluid = val('ivFluid');
  if (ivSite || ivType || ivAssessment || ivFluid) {
    lines.push('  IV Access:');
    addLine('  Site           ', ivSite);
    addLine('  Type           ', ivType);
    addLine('  Assessment     ', ivAssessment);
    addLine('  Fluid & Rate   ', ivFluid);
    lines.push('');
  }

  // Drains & Tubes
  const drainSite = val('drainSite'), drainType = val('drainType'), drainAssess = val('drainAssessment');
  if (drainSite || drainType || drainAssess) {
    lines.push('  Drains & Tubes:');
    addLine('  Site           ', drainSite);
    addLine('  Type           ', drainType);
    addLine('  Assessment     ', drainAssess);
    lines.push('');
  }

  // Wounds
  const wSite = val('woundSite'), wType = val('woundType'), wAssess = val('woundAssessment');
  if (wSite || wType || wAssess) {
    lines.push('  Wounds:');
    addLine('  Site           ', wSite);
    addLine('  Type           ', wType);
    addLine('  Assessment     ', wAssess);
    lines.push('');
  }

  // ADLs
  const diet = val('diet'), activity = val('activity');
  if (diet || activity) {
    lines.push('  Activities of Daily Living:');
    addLine('  Diet           ', diet);
    addLine('  Activity       ', activity);
    lines.push('');
  }

  // Restrictions
  const isolation = val('isolation'), fallRisk = val('fallRisk');
  if (isolation || fallRisk) {
    lines.push('  Restrictions:');
    addLine('  Isolation      ', isolation);
    addLine('  Fall Risk      ', fallRisk);
    lines.push('');
  }

  // System Assessments
  const sysFields = [
    ['neurologic',    'Neurologic    '],
    ['cardiac',       'Cardiac       '],
    ['respiratory',   'Respiratory   '],
    ['giGu',          'GI/GU         '],
    ['integumentary', 'Integumentary '],
    ['orthoMobility', 'Ortho/Mobility'],
    ['psychosocial',  'Psychosocial  '],
    ['systemOther',   'Other         '],
  ];
  const sysRows = sysFields.map(([id, label]) => ({ label, value: val(id) })).filter((f) => f.value);
  if (sysRows.length) {
    lines.push('  System Assessments:');
    sysRows.forEach((f) => addLine(`  ${f.label}`, f.value));
    lines.push('');
  }

  // Labs & Diagnostics
  if (val('labsAndDiagnostics')) {
    lines.push('  Labs & Diagnostics:');
    lines.push(`    ${val('labsAndDiagnostics')}`);
    lines.push('');
  }

  // ── A – Assessment
  lines.push('A — ASSESSMENT');
  lines.push(separator);
  lines.push(`  ${val('nursesAssessment')}`);
  lines.push('');

  // ── R – Recommendation
  lines.push('R — RECOMMENDATION');
  lines.push(separator);
  addLine('Plan of Care          ', val('planOfCare'));
  addLine('Test Results Pending  ', val('testResultsPending'));
  addLine('Orders Pending        ', val('ordersPendingCompletion'));
  addLine('Other                 ', val('recommendationOther'));

  return lines.join('\n');
}

// ── Report: HTML rendering ────────────────────────────────────────────────────

/** Escape text for safe HTML insertion. */
function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Build a labelled row HTML string. */
function rowHtml(label, value) {
  if (!value) return '';
  return `<div class="report-row"><span class="report-label">${esc(label)}</span><span class="report-value">${esc(value)}</span></div>`;
}

/** Build a subsection block of rows (only rendered when at least one row has data). */
function subsectionHtml(title, rows) {
  const content = rows.map(([label, value]) => rowHtml(label, value)).join('');
  if (!content) return '';
  return `<div class="report-subsection"><div class="report-subsection-title">${esc(title)}</div><div class="report-rows">${content}</div></div>`;
}

/**
 * Build an HTML report from the current form values.
 * @returns {string}
 */
function buildReportHtml() {
  const parts = [];

  // Meta bar
  parts.push(`<div class="report-meta"><span><strong>Current:</strong> ${esc(val('currentDateTime'))}</span><span><strong>Admitted:</strong> ${esc(val('admissionDateTime'))}</span></div>`);

  // ── S – Situation
  const sRows = [
    ['Patient Name', val('name')],
    ['Age', val('age')],
    ['Sex', val('sex')],
    ['Ethnicity', val('ethnicity')],
    ['Religion', val('religion')],
    ['Provider', val('provider')],
    ['Admission Diagnosis', val('admissionDiagnosis')],
  ].map(([l, v]) => rowHtml(l, v)).join('');

  parts.push(`<div class="report-section"><div class="report-section-header"><span class="badge badge-s">S</span> Situation</div><div class="report-rows">${sRows}</div></div>`);

  // ── B – Background
  let bContent = '';
  bContent += [
    ['Medical History', val('pertinentMedicalHistory')],
    ['Social History', val('pertinentSocialHistory')],
    ['Allergies', val('allergies')],
    ['Code Status', val('codeStatus')],
  ].map(([l, v]) => rowHtml(l, v)).join('');

  // Vital Signs
  const vsRows = [
    ['Time', val('vsTime')],
    ['Temp (°F)', val('tempF')],
    ['Temp (°C)', val('tempC')],
    ['Blood Pressure', val('bloodPressure')],
    ['Pulse (bpm)', val('pulse')],
    ['Resp. Rate', val('respiratoryRate')],
    ['O₂ Saturation (%)', val('oxygenSaturation')],
  ];
  bContent += subsectionHtml('Vital Signs (Most Recent)', vsRows);

  // Oxygen
  const oxyRows = [['Mode', val('oxygenMode')], ['Liters/Minute', val('oxygenLPM')]];
  bContent += subsectionHtml('Oxygen Therapy', oxyRows);

  // Pain
  const painRows = [['Rating', val('painRating')], ['Last Medication', val('painMedication')], ['Medication Time', val('medicationTime')]];
  bContent += subsectionHtml('Pain', painRows);

  // Other Meds
  if (val('otherRecentMedications')) {
    bContent += subsectionHtml('Other Recent Medications', [['Medications', val('otherRecentMedications')]]);
  }

  // IV Access
  bContent += subsectionHtml('IV Access', [
    ['Site', val('ivSite')], ['Type', val('ivType')], ['Assessment', val('ivAssessment')], ['Fluid & Rate', val('ivFluid')],
  ]);

  // Drains & Tubes
  bContent += subsectionHtml('Drains & Tubes', [
    ['Site', val('drainSite')], ['Type', val('drainType')], ['Assessment', val('drainAssessment')],
  ]);

  // Wounds
  bContent += subsectionHtml('Wounds', [
    ['Site', val('woundSite')], ['Type', val('woundType')], ['Assessment', val('woundAssessment')],
  ]);

  // ADLs
  bContent += subsectionHtml('Activities of Daily Living', [['Diet', val('diet')], ['Activity', val('activity')]]);

  // Restrictions
  bContent += subsectionHtml('Restrictions', [['Isolation', val('isolation')], ['Fall Risk', val('fallRisk')]]);

  // System Assessments
  const sysRows = [
    ['Neurologic', val('neurologic')],
    ['Cardiac', val('cardiac')],
    ['Respiratory', val('respiratory')],
    ['GI/GU', val('giGu')],
    ['Integumentary', val('integumentary')],
    ['Ortho/Mobility', val('orthoMobility')],
    ['Psychosocial', val('psychosocial')],
    ['Other', val('systemOther')],
  ];
  bContent += subsectionHtml('System Assessments', sysRows);

  // Labs
  if (val('labsAndDiagnostics')) {
    bContent += subsectionHtml('Labs & Diagnostics', [['Results', val('labsAndDiagnostics')]]);
  }

  if (bContent) {
    parts.push(`<div class="report-section"><div class="report-section-header"><span class="badge badge-b">B</span> Background</div>${bContent}</div>`);
  }

  // ── A – Assessment
  parts.push(`<div class="report-section"><div class="report-section-header"><span class="badge badge-a">A</span> Assessment</div><div class="report-narrative">${esc(val('nursesAssessment'))}</div></div>`);

  // ── R – Recommendation
  const rRows = [
    ['Plan of Care', val('planOfCare')],
    ['Test Results Pending', val('testResultsPending')],
    ['Orders Pending', val('ordersPendingCompletion')],
    ['Other', val('recommendationOther')],
  ].map(([l, v]) => rowHtml(l, v)).join('');

  if (rRows) {
    parts.push(`<div class="report-section"><div class="report-section-header"><span class="badge badge-r">R</span> Recommendation</div><div class="report-rows">${rRows}</div></div>`);
  }

  return parts.join('');
}

// ── Section navigation active state ──────────────────────────────────────────

function initSectionNav() {
  const sections = [
    { id: 'section-general',        pill: document.querySelector('.nav-general') },
    { id: 'section-situation',      pill: document.querySelector('.nav-s') },
    { id: 'section-background',     pill: document.querySelector('.nav-b') },
    { id: 'section-assessment',     pill: document.querySelector('.nav-a') },
    { id: 'section-recommendation', pill: document.querySelector('.nav-r') },
  ].filter((s) => document.getElementById(s.id) && s.pill);

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const activate = (id) => {
    sections.forEach((s) => {
      s.pill.classList.toggle('active', s.id === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activate(entry.target.id);
      });
    },
    {
      // Top 20% of viewport used for entry detection; bottom 70% excluded so
      // only the section currently in the upper reading area is highlighted.
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    }
  );

  sections.forEach((s) => observer.observe(document.getElementById(s.id)));
}

// ── Scroll-to-top ─────────────────────────────────────────────────────────────

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  let scrollThrottled = false;
  window.addEventListener('scroll', () => {
    if (scrollThrottled) return;
    scrollThrottled = true;
    requestAnimationFrame(() => {
      btn.classList.toggle('visible', window.scrollY > 300);
      scrollThrottled = false;
    });
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Event Handlers ────────────────────────────────────────────────────────────

/** Remove invalid styling when the user starts correcting a field. */
function attachInputListeners() {
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => el.classList.remove('invalid'));
    el.addEventListener('change', () => el.classList.remove('invalid'));
  });
}

/** Debounce helper. */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Handle form submission: validate, build report, and display it. */
function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) {
    const first = document.querySelector('.invalid');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const reportSection = document.getElementById('reportSection');
  const reportContent = document.getElementById('reportContent');

  // Store plain-text version for clipboard; render HTML for display.
  reportContent._plainText = buildReport();
  reportContent.innerHTML = buildReportHtml();

  reportSection.classList.remove('hidden');
  reportSection.scrollIntoView({ behavior: 'smooth' });
}

/** Clear the form and hide the report. */
function handleClear() {
  if (!confirm('Clear all form fields? This cannot be undone.')) return;
  document.getElementById('sbarForm').reset();
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('invalid');
  });
  document.getElementById('reportSection').classList.add('hidden');
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/** Copy the report plain text to the clipboard. */
async function handleCopy() {
  const reportContent = document.getElementById('reportContent');
  const text = reportContent._plainText || reportContent.textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch {
    // Fallback: select visible text
    const range = document.createRange();
    range.selectNodeContents(reportContent);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    showToast('Could not copy automatically — text selected instead.', 'info');
  }
}

/** Trigger the browser print dialog. */
function handlePrint() {
  window.print();
}

// ── Initialization ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Auto-populate current date/time if the field is empty
  const dtField = document.getElementById('currentDateTime');
  if (dtField && !dtField.value) dtField.value = formatNow();

  // Restore any auto-saved form data (may overwrite the date/time if previously saved)
  loadSavedData();

  // Wire up event listeners
  attachInputListeners();
  document.getElementById('sbarForm').addEventListener('submit', handleSubmit);
  document.getElementById('clearBtn').addEventListener('click', handleClear);
  document.getElementById('copyBtn').addEventListener('click', handleCopy);
  document.getElementById('printBtn').addEventListener('click', handlePrint);

  // Auto-save on any form input (debounced 800 ms)
  const debouncedSave = debounce(saveFormData, 800);
  document.getElementById('sbarForm').addEventListener('input', debouncedSave);
  document.getElementById('sbarForm').addEventListener('change', debouncedSave);

  // Section navigation active state
  initSectionNav();

  // Scroll-to-top button
  initScrollTop();
});
