// ---------------- SPREADSHEET / LEADERBOARD ----------------
const SPREADSHEET_ID = '1c3IPAxWDR9RZnEB1Nw8syOfI4fhAAoYJvrtLZMXiZjA';
const GID = '1119948727';
const POLL_MS = 5000;
let lastSnapshot = '';

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
function displayVal(cell) { return cell ? (cell.f ?? cell.v ?? '') : ''; }
function numericVal(cell) {
  if (!cell) return NaN;
  if (typeof cell.v === 'number') return cell.v;
  const raw = String(cell.f ?? cell.v ?? '').replace(/[,%]/g, '').trim();
  if (raw === '') return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}
function parseTime(cell, disp) {
  const n = numericVal(cell);
  if (Number.isFinite(n)) return n;
  const s = String(disp ?? '').trim();
  if (s.includes(':')) {
    const [h, m = '0'] = s.split(':');
    const hh = Number(h), mm = Number(m);
    if (Number.isFinite(hh) && Number.isFinite(mm)) return hh + mm / 60;
  }
  const n2 = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n2) ? n2 : NaN;
}

async function fetchAndRender() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=${GID}&tqx=out:json`;
    const r = await fetch(url, { cache: 'no-store' });
    const txt = await r.text();
    const match = txt.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match) return;
    const json = JSON.parse(match[1]);

    const cols = (json.table.cols || []).map(c => (c.label || c.id || '').trim());
    const findIdx = (arr) => cols.findIndex(h => arr.some(rx => rx.test(h)));

    const idxName = findIdx([/^name$/i]);
    const idxOut = findIdx([/^total\s*output/i, /^output$/i]);
    const idxAcc = findIdx([/^total\s*accuracy/i, /^accuracy$/i]);
    const idxTime = findIdx([/^total\s*att\.?\s*time/i, /^total\s*att.*time/i, /^att.*time$/i]);
    const idxSeedsReceived = findIdx([/seeds.*received/i, /seeds.*recv/i, /^received.*seeds/i, /^seeds$/i]);
    const idxSeedsCorrect = findIdx([/seeds.*correct/i, /correct.*seeds/i, /^correct$/i]);

    if ([idxName, idxOut, idxAcc, idxTime, idxSeedsReceived, idxSeedsCorrect].some(i => i < 0)) return;

    const rows = (json.table.rows || []).map(r => r.c || []);
    const data = rows
      .filter(r => r[idxName] && displayVal(r[idxName]) !== '')
      .map(r => ({
        name: displayVal(r[idxName]),
        seedsCorrectDisp: displayVal(r[idxSeedsCorrect]),
        seedsReceivedDisp: displayVal(r[idxSeedsReceived]),
        outputDisp: displayVal(r[idxOut]),
        outputNum: numericVal(r[idxOut]),
        accDisp: displayVal(r[idxAcc]),
        accNum: numericVal(r[idxAcc]),
        timeDisp: displayVal(r[idxTime]),
        timeNum: parseTime(r[idxTime], displayVal(r[idxTime]))
      }));

    const snapshot = JSON.stringify(data);
    if (snapshot === lastSnapshot) {
      document.getElementById('last-update').textContent = 'Leaderboard up to date';
      return;
    }
    lastSnapshot = snapshot;

    const targetOutput = 1800;
    const targetAcc = 95;
    const targetTime = 6.5;

    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = data.map(d => {
      const clsOut = Number.isFinite(d.outputNum) && d.outputNum >= targetOutput ? 'quota-reached' : 'quota-unreached';
      const clsAcc = Number.isFinite(d.accNum) && d.accNum >= targetAcc ? 'quota-reached' : 'quota-unreached';
      const clsTime = Number.isFinite(d.timeNum) && d.timeNum >= targetTime ? 'quota-reached' : 'quota-unreached';

      return `<tr>
        <td>${esc(d.name)}</td>
        <td class="num">${esc(d.seedsCorrectDisp)}</td>
        <td class="num">${esc(d.seedsReceivedDisp)}</td>
        <td class="num ${clsOut}">${esc(d.outputDisp)}</td>
        <td class="${clsAcc}">${esc(d.accDisp)}</td>
        <td class="num ${clsTime}">${esc(d.timeDisp)}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="6" class="loading">No rows.</td></tr>`;

    document.getElementById('last-update').textContent =
      'Leaderboard updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
    document.getElementById('last-update').textContent = 'Leaderboard Error';
  }
}

fetchAndRender();
setInterval(fetchAndRender, POLL_MS);

// ---------------- PHILIPPINES CLOCK ----------------
async function fetchPHTime() {
  try {
    const res = await fetch('https://timeapi.io/api/timezone/zone?timeZone=Asia%2FManila');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return new Date(data.currentLocalTime);
  } catch (err) {
    console.error('Failed to fetch PH time:', err);
    return null;
  }
}

function format12HourNoAmPm(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
}

async function updatePHClock() {
  const el = document.getElementById('time-now');
  if (!el) return console.warn('#time-now element not found');

  const dt = await fetchPHTime();
  el.textContent = dt ? format12HourNoAmPm(dt) : '--:--:--';
}

updatePHClock();
setInterval(updatePHClock, 100);