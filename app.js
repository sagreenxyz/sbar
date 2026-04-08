'use strict';

// ── Example Data ──────────────────────────────────────────────────────────────

/** Lisa Rae example used by the "Load Example" button. */
const EXAMPLE_DATA = {
  currentDateTime: 'Monday 1200',
  admissionDateTime: 'Monday 1025',
  name: 'Lisa Rae',
  age: '78',
  sex: 'Female',
  ethnicity: 'Caucasian',
  religion: 'None specified',
  provider: 'Linda Moore, MD',
  admissionDiagnosis: 'Hypotension, mechanical fall',
  pertinentMedicalHistory: 'History of hypertension, falls, and osteoporosis; osteoarthritis in right knee',
  pertinentSocialHistory: 'Patient lives in an assisted living facility. Her daughter lives in the area.',
  allergies: 'No known allergies',
  codeStatus: 'Full code',
  vsTime: '1040',
  tempF: '98.8',
  tempC: '37.1',
  bloodPressure: '94/70',
  pulse: '84',
  respiratoryRate: '18',
  oxygenSaturation: '93',
  oxygenMode: 'Room air',
  oxygenLPM: '',
  painRating: '5/10',
  painMedication: '0.2 mg hydromorphone IV',
  medicationTime: '1140',
  otherRecentMedications: 'Patient took 50 mg hydrochlorothiazide, 10 mg alendronate, and 600 mg calcium carbonate at home this morning. Patient reports that she might have inadvertently taken 2 tabs (100 mg) of hydrochlorothiazide.',
  ivSite: 'Right antecubital',
  ivType: '18-gauge PIV',
  ivAssessment: 'Intact, patent',
  ivFluid: '0.9% normal saline IV at 75 mL/hr',
  drainSite: '',
  drainType: '',
  drainAssessment: '',
  woundSite: 'Right hip',
  woundType: 'Hematoma',
  woundAssessment: 'Intact, warm, and tender to palpation',
  diet: '3 g sodium diet',
  activity: 'Up with moderate assistance and walker',
  isolation: 'Standard precautions',
  fallRisk: 'Not yet completed',
  neurologic: 'Alert and oriented x 2 (oriented to person and place, disoriented to day/time)',
  cardiac: 'S1, S2 regular rate',
  respiratory: 'Lungs clear throughout',
  giGu: 'Bowel sounds present in all 4 quadrants; some involuntary urinary incontinence',
  integumentary: 'Ecchymotic area on right hip',
  orthoMobility: 'Weak',
  psychosocial: 'Daughter lives in town',
  systemOther: '',
  labsAndDiagnostics: 'Results from complete blood count and basic metabolic panel are within normal limits.',
  nursesAssessment: 'Lisa Rae was alert and oriented x 3 in the emergency department. She has been disoriented to time since admission, possibly related to hydromorphone administration. She has complained of grogginess and almost fell trying to get to the bedside commode.',
  planOfCare: 'Rehydrate with maintenance IV fluids; physical therapy/occupational therapy to evaluate and treat for home safety',
  testResultsPending: '',
  ordersPendingCompletion: '',
  recommendationOther: 'The nursing admission has been completed. A pressure ulcer risk assessment (Braden Scale) and fall risk assessment (Morse Fall Scale) need to be completed.',
};

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
 * Append a line to the report buffer only when the value is non-empty.
 * @param {string[]} lines
 * @param {string} label
 * @param {string} value
 */
function addLine(lines, label, value) {
  if (value) lines.push(`  ${label}: ${value}`);
}

// ── Validation ────────────────────────────────────────────────────────────────

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

// ── Report Generation ─────────────────────────────────────────────────────────

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
  addLine(lines, 'Patient Name      ', val('name'));
  addLine(lines, 'Age               ', val('age'));
  addLine(lines, 'Sex               ', val('sex'));
  addLine(lines, 'Ethnicity         ', val('ethnicity'));
  addLine(lines, 'Religion          ', val('religion'));
  addLine(lines, 'Provider          ', val('provider'));
  addLine(lines, 'Admission Diagnosis', val('admissionDiagnosis'));
  lines.push('');

  // ── B – Background
  lines.push('B — BACKGROUND');
  lines.push(separator);
  addLine(lines, 'Medical History   ', val('pertinentMedicalHistory'));
  addLine(lines, 'Social History    ', val('pertinentSocialHistory'));
  addLine(lines, 'Allergies         ', val('allergies'));
  addLine(lines, 'Code Status       ', val('codeStatus'));
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
  const vsLines = vsFields
    .map(([id, label]) => ({ label, value: val(id) }))
    .filter((f) => f.value);

  if (vsLines.length) {
    lines.push('  Vital Signs:');
    vsLines.forEach((f) => addLine(lines, `  ${f.label}`, f.value));
    lines.push('');
  }

  // Oxygen Therapy
  const oxyMode = val('oxygenMode');
  const oxyLPM  = val('oxygenLPM');
  if (oxyMode || oxyLPM) {
    lines.push('  Oxygen Therapy:');
    addLine(lines, '  Mode           ', oxyMode);
    if (oxyLPM) addLine(lines, '  Liters/Minute  ', oxyLPM);
    lines.push('');
  }

  // Pain
  const painRating = val('painRating');
  const painMed    = val('painMedication');
  const painTime   = val('medicationTime');
  if (painRating || painMed || painTime) {
    lines.push('  Pain:');
    addLine(lines, '  Rating         ', painRating);
    addLine(lines, '  Last Medication', painMed);
    addLine(lines, '  Medication Time', painTime);
    lines.push('');
  }

  // Other Meds
  addLine(lines, 'Other Medications ', val('otherRecentMedications'));
  if (val('otherRecentMedications')) lines.push('');

  // IV Access
  const ivSite = val('ivSite');
  const ivType = val('ivType');
  const ivAssessment = val('ivAssessment');
  const ivFluid = val('ivFluid');
  if (ivSite || ivType || ivAssessment || ivFluid) {
    lines.push('  IV Access:');
    addLine(lines, '  Site           ', ivSite);
    addLine(lines, '  Type           ', ivType);
    addLine(lines, '  Assessment     ', ivAssessment);
    addLine(lines, '  Fluid & Rate   ', ivFluid);
    lines.push('');
  }

  // Drains & Tubes
  const drainSite = val('drainSite');
  const drainType = val('drainType');
  const drainAssess = val('drainAssessment');
  if (drainSite || drainType || drainAssess) {
    lines.push('  Drains & Tubes:');
    addLine(lines, '  Site           ', drainSite);
    addLine(lines, '  Type           ', drainType);
    addLine(lines, '  Assessment     ', drainAssess);
    lines.push('');
  }

  // Wounds
  const wSite = val('woundSite');
  const wType = val('woundType');
  const wAssess = val('woundAssessment');
  if (wSite || wType || wAssess) {
    lines.push('  Wounds:');
    addLine(lines, '  Site           ', wSite);
    addLine(lines, '  Type           ', wType);
    addLine(lines, '  Assessment     ', wAssess);
    lines.push('');
  }

  // ADLs
  const diet     = val('diet');
  const activity = val('activity');
  if (diet || activity) {
    lines.push('  Activities of Daily Living:');
    addLine(lines, '  Diet           ', diet);
    addLine(lines, '  Activity       ', activity);
    lines.push('');
  }

  // Restrictions
  const isolation = val('isolation');
  const fallRisk  = val('fallRisk');
  if (isolation || fallRisk) {
    lines.push('  Restrictions:');
    addLine(lines, '  Isolation      ', isolation);
    addLine(lines, '  Fall Risk      ', fallRisk);
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
  const sysLines = sysFields
    .map(([id, label]) => ({ label, value: val(id) }))
    .filter((f) => f.value);

  if (sysLines.length) {
    lines.push('  System Assessments:');
    sysLines.forEach((f) => addLine(lines, `  ${f.label}`, f.value));
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
  addLine(lines, 'Plan of Care          ', val('planOfCare'));
  addLine(lines, 'Test Results Pending  ', val('testResultsPending'));
  addLine(lines, 'Orders Pending        ', val('ordersPendingCompletion'));
  addLine(lines, 'Other                 ', val('recommendationOther'));

  return lines.join('\n');
}

// ── JSON Export ───────────────────────────────────────────────────────────────

/**
 * Build a JSON object from the current form values, conforming to the
 * SBAR hand-off patient report schema.
 * @returns {object}
 */
function buildJsonReport() {
  const nullIfEmpty = (v) => v || null;
  const numOrNull   = (v) => (v !== '' && !isNaN(Number(v)) ? Number(v) : null);

  return {
    currentDateTime:  val('currentDateTime'),
    admissionDateTime: val('admissionDateTime'),

    situation: {
      name:               val('name'),
      age:                numOrNull(val('age')),
      sex:                val('sex'),
      ethnicity:          nullIfEmpty(val('ethnicity')),
      religion:           nullIfEmpty(val('religion')),
      provider:           val('provider'),
      admissionDiagnosis: val('admissionDiagnosis'),
    },

    background: {
      pertinentMedicalHistory: nullIfEmpty(val('pertinentMedicalHistory')),
      pertinentSocialHistory:  nullIfEmpty(val('pertinentSocialHistory')),
      allergies:               val('allergies'),
      codeStatus:              val('codeStatus'),

      vitalSigns: {
        time:                    nullIfEmpty(val('vsTime')),
        temperatureFahrenheit:   numOrNull(val('tempF')),
        temperatureCelsius:      numOrNull(val('tempC')),
        bloodPressure:           nullIfEmpty(val('bloodPressure')),
        pulse:                   numOrNull(val('pulse')),
        respiratoryRate:         numOrNull(val('respiratoryRate')),
        oxygenSaturationPercent: numOrNull(val('oxygenSaturation')),
      },

      oxygenTherapy: {
        mode:           nullIfEmpty(val('oxygenMode')),
        litersPerMinute: numOrNull(val('oxygenLPM')),
      },

      pain: {
        rating:                  nullIfEmpty(val('painRating')),
        mostRecentPainMedication: nullIfEmpty(val('painMedication')),
        medicationTime:          nullIfEmpty(val('medicationTime')),
      },

      otherRecentMedications: nullIfEmpty(val('otherRecentMedications')),

      ivAccess: {
        site:       nullIfEmpty(val('ivSite')),
        type:       nullIfEmpty(val('ivType')),
        assessment: nullIfEmpty(val('ivAssessment')),
        fluid:      nullIfEmpty(val('ivFluid')),
      },

      drainsAndTubes: {
        site:       nullIfEmpty(val('drainSite')),
        type:       nullIfEmpty(val('drainType')),
        assessment: nullIfEmpty(val('drainAssessment')),
      },

      wounds: {
        site:       nullIfEmpty(val('woundSite')),
        type:       nullIfEmpty(val('woundType')),
        assessment: nullIfEmpty(val('woundAssessment')),
      },

      adls: {
        diet:     nullIfEmpty(val('diet')),
        activity: nullIfEmpty(val('activity')),
      },

      restrictions: {
        isolation: nullIfEmpty(val('isolation')),
        fallRisk:  nullIfEmpty(val('fallRisk')),
      },

      systemAssessments: {
        neurologic:     nullIfEmpty(val('neurologic')),
        cardiac:        nullIfEmpty(val('cardiac')),
        respiratory:    nullIfEmpty(val('respiratory')),
        giGu:           nullIfEmpty(val('giGu')),
        integumentary:  nullIfEmpty(val('integumentary')),
        orthoMobility:  nullIfEmpty(val('orthoMobility')),
        psychosocial:   nullIfEmpty(val('psychosocial')),
        other:          nullIfEmpty(val('systemOther')),
      },

      labsAndDiagnostics: nullIfEmpty(val('labsAndDiagnostics')),
    },

    assessment: {
      nursesAssessment: val('nursesAssessment'),
    },

    recommendation: {
      planOfCare:              nullIfEmpty(val('planOfCare')),
      testResultsPending:      nullIfEmpty(val('testResultsPending')),
      ordersPendingCompletion: nullIfEmpty(val('ordersPendingCompletion')),
      other:                   nullIfEmpty(val('recommendationOther')),
    },
  };
}

// ── Event Handlers ────────────────────────────────────────────────────────────

/** Pre-fill the form with the built-in Lisa Rae example. */
function handleLoadExample() {
  const hasData = REQUIRED_FIELDS.some((id) => val(id));
  if (hasData) {
    if (!confirm('Load the example patient? This will overwrite any data you have entered.')) return;
  }
  Object.entries(EXAMPLE_DATA).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value;
    el.classList.remove('invalid');
  });
  document.getElementById('reportSection').classList.add('hidden');
}

/** Download the current form data as a JSON file. */
function handleDownloadJson() {
  const data = buildJsonReport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const patientName = (val('name') || 'sbar-report').replace(/\s+/g, '-').toLowerCase();
  a.href     = url;
  a.download = `${patientName}-sbar.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Remove invalid styling when the user starts correcting a field. */
function attachInputListeners() {
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => el.classList.remove('invalid'));
    el.addEventListener('change', () => el.classList.remove('invalid'));
  });
}

/** Handle form submission: validate, build report, and display it. */
function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) {
    // Scroll to first invalid field
    const first = document.querySelector('.invalid');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const report = buildReport();
  const reportSection = document.getElementById('reportSection');
  const reportContent = document.getElementById('reportContent');

  reportContent.textContent = report;
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
}

/** Copy the report text to the clipboard. */
async function handleCopy() {
  const text = document.getElementById('reportContent').textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('copyBtn');
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 2000);
  } catch {
    // Fallback: select the text
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('reportContent'));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/** Trigger the browser print dialog. */
function handlePrint() {
  window.print();
}

// ── Initialization ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  attachInputListeners();

  document.getElementById('sbarForm').addEventListener('submit', handleSubmit);
  document.getElementById('clearBtn').addEventListener('click', handleClear);
  document.getElementById('loadExampleBtn').addEventListener('click', handleLoadExample);
  document.getElementById('copyBtn').addEventListener('click', handleCopy);
  document.getElementById('printBtn').addEventListener('click', handlePrint);
  document.getElementById('downloadJsonBtn').addEventListener('click', handleDownloadJson);
});
