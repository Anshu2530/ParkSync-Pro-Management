'use strict';

/* AUTHENTICATION CHECK */
if (!localStorage.getItem('parkSyncAuth')) {
  window.location.replace('/login.html');
}

function handleLogout() {
  localStorage.removeItem('parkSyncAuth');
  localStorage.removeItem('parkSyncUser');
  window.location.replace('/login.html');
}

/* UTILITIES */
function formatPKR(amount) {
  return 'Rs ' + Math.round(amount || 0).toLocaleString('en-PK');
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PK');
}

function elapsed(entryTime) {
  const ms = Date.now() - new Date(entryTime).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return pad(h) + ':' + pad(m) + ':' + pad(s);
}

function pad(n) { return String(n).padStart(2, '0'); }

function liveCost(entryTime, hourlyRate) {
  const hours = (Date.now() - new Date(entryTime).getTime()) / 3600000;
  return formatPKR(hours * hourlyRate);
}

/* INLINE SVG ICONS */
const SVG = {
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M2 9h20"/></svg>',
  banknote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  mappin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  arrows: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 3l.5 1.5 1.5.5-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z"/><path d="M19 17l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z"/></svg>',
  bike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1-1h-2l-3 9"/><path d="m15 6-5 9"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6M16 6v6M2 12h19.6M18 18h3s.5-1.7.8-4.3c.3-2.7.2-3.7 0-5.7-.2-2-.8-3-2-3.3C19 4 18 4 16 4H8C6 4 5 4 4.2 4.7c-1.2.3-1.8 1.3-2 3.3C2 10 2 11 2.2 13.7c.3 2.6.8 4.3.8 4.3h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  rupee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12M6 8h12M15 21 6 8"/><path d="M6 13h3a4 4 0 0 0 0-8"/></svg>',
};

function icon(name) {
  return '<span style="display:inline-flex;align-items:center;width:1em;height:1em;">' + (SVG[name] || '') + '</span>';
}

/* TOAST */
function showToast(title, desc, type) {
  type = type || 'success';
  const tc = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.innerHTML = '<div class="toast-title">' + escHtml(title) + '</div>' +
    (desc ? '<div class="toast-desc">' + escHtml(desc) + '</div>' : '');
  tc.appendChild(el);
  requestAnimationFrame(function() { el.classList.add('visible'); });
  setTimeout(function() {
    el.classList.remove('visible');
    setTimeout(function() { el.remove(); }, 300);
  }, 3500);
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* API */
async function apiFetch(path, opts) {
  opts = opts || {};
  const res = await fetch('/api' + path, Object.assign({
    headers: { 'Content-Type': 'application/json' }
  }, opts));
  if (!res.ok) {
    const d = await res.json().catch(function() { return {}; });
    throw new Error(d.error || 'Request failed (HTTP ' + res.status + ')');
  }
  return res.json();
}

/*  ROUTER */
let cleanupPage = null;

const pageHandlers = {
  '/': dashboardPage,
  '/entry': entryPage,
  '/active': activeSessionsPage,
  '/history': historyPage,
  '/spots': spotsPage,
  '/zones': zonesPage,
};

function navigate(path) {
  location.hash = '#' + path;
}

function getCurrentPath() {
  const h = location.hash.replace('#', '');
  return h || '/';
}

function renderPage(path) {
  if (cleanupPage) { cleanupPage(); cleanupPage = null; }

  document.querySelectorAll('.nav-link').forEach(function(a) {
    a.classList.toggle('active', a.dataset.path === path);
  });

  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="page-loading">Loading…</div>';

  const handler = pageHandlers[path] || dashboardPage;
  handler(content).then(function(cleanup) {
    if (typeof cleanup === 'function') cleanupPage = cleanup;
  }).catch(function(e) {
    content.innerHTML = '<div style="padding:48px;color:#f43f5e;">Error: ' + escHtml(e.message) + '</div>';
  });
}

window.addEventListener('hashchange', function() { renderPage(getCurrentPath()); });

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-link').forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      navigate(a.dataset.path);
    });
  });
  if (!location.hash) location.hash = '#/';
  renderPage(getCurrentPath());

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});

/* DASHBOARD PAGE */
async function dashboardPage(container) {
  const [stats, spots] = await Promise.all([
    apiFetch('/dashboard/stats').catch(function() { return null; }),
    apiFetch('/parking-spots').catch(function() { return []; }),
  ]);

  container.innerHTML = buildDashHTML(stats, spots);
  setTimeout(function() { if (stats) updateDashStats(stats); }, 50);

  document.getElementById('hero-entry-btn').addEventListener('click', function() { navigate('/entry'); });

  const interval = setInterval(async function() {
    try {
      const [ns, nsp] = await Promise.all([apiFetch('/dashboard/stats'), apiFetch('/parking-spots')]);
      if (ns) updateDashStats(ns);
      if (nsp) {
        const g = document.getElementById('spot-grid');
        if (g) g.innerHTML = buildSpotGridCells(nsp);
      }
    } catch(e) {}
  }, 5000);

  return function() { clearInterval(interval); };
}

function updateDashStats(s) {
  setText('stat-revenue', formatPKR(s.todayRevenue));
  setText('stat-sessions', s.activeSessions);
  setText('stat-available', s.availableSpots);
  setText('stat-vehicles', s.todayVehicles);
  const occ = s.occupancyRate || 0;
  setText('stat-occ', occ.toFixed(0) + '%');
  const occColor = occ > 80 ? 'var(--rose)' : occ > 50 ? 'var(--amber)' : 'var(--emerald)';
  const occEl = document.getElementById('stat-occ');
  if (occEl) occEl.style.color = occColor;
  const bar = document.getElementById('stat-occ-bar');
  if (bar) { bar.style.width = occ + '%'; bar.style.backgroundColor = occColor; }
  setText('qs-vehicles', s.todayVehicles);
  setText('qs-reserved', s.reservedSpots);
  setText('qs-maintenance', s.maintenanceSpots);
  setText('qs-occupied', s.occupiedSpots);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function buildSpotGridCells(spots) {
  return spots.slice(0, 60).map(function(s) {
    const color = s.status === 'available' ? 'var(--emerald)' :
                  s.status === 'occupied'  ? 'var(--rose)' : 'var(--amber)';
    return '<div class="spot-cell" style="background:' + color + ';opacity:0.75" title="' +
      escHtml(s.spotNumber) + ' — ' + s.status + '"></div>';
  }).join('');
}

function buildDashHTML(stats, spots) {
  const occ = (stats && stats.occupancyRate) || 0;
  const occColor = occ > 80 ? 'var(--rose)' : occ > 50 ? 'var(--amber)' : 'var(--emerald)';

  return '<div class="page-space">' +

    /* Hero */
    '<div class="hero-banner">' +
      '<img src="/images/parking-hero.png" alt="Parking" class="hero-img" onerror="this.style.opacity=0.2">' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-content">' +
        '<div class="hero-badge">' + icon('zap') + ' Live System Active</div>' +
        '<h1 class="hero-title">Smart Parking<br>Dashboard</h1>' +
        '<p class="hero-sub">Real-time occupancy, revenue &amp; session monitoring.</p>' +
        '<button id="hero-entry-btn" class="btn btn-primary" style="margin-top:8px">' +
          icon('car') + ' Register Vehicle Entry' +
        '</button>' +
      '</div>' +
      '<div class="hero-occ-pill">' +
        '<div class="occ-label">OCCUPANCY</div>' +
        '<div class="occ-value" id="stat-occ" style="color:' + occColor + '">' + occ.toFixed(0) + '%</div>' +
        '<div class="occ-bar-bg"><div class="occ-bar" id="stat-occ-bar" style="width:0%;background:' + occColor + '"></div></div>' +
      '</div>' +
    '</div>' +

    /* Stat Cards */
    '<div class="stat-grid">' +
      statCard('stat-emerald', 'Today\'s Revenue', formatPKR(stats ? stats.todayRevenue : 0), icon('banknote'), 'emerald', 'stat-revenue') +
      statCard('stat-teal', 'Active Sessions', stats ? stats.activeSessions : 0, icon('activity'), 'teal', 'stat-sessions') +
      statCard('stat-blue', 'Available Spots', stats ? stats.availableSpots : 0, icon('mappin'), 'blue', 'stat-available', 'of ' + (stats ? stats.totalSpots : 0) + ' total') +
      statCard('stat-violet', 'Today\'s Vehicles', stats ? stats.todayVehicles : 0, icon('trending'), 'violet', 'stat-vehicles') +
    '</div>' +

    /* Bottom Grid */
    '<div class="dash-bottom">' +
      /* Spot Map */
      '<div class="card spot-map-card">' +
        '<div class="card-img-header" style="background-image:url(\'/images/zone-banner.png\');background-size:cover;background-position:center 60%">' +
          '<div class="card-img-overlay"></div>' +
          '<div class="card-img-content">' +
            '<h2 class="card-title">' + icon('mappin') + ' Live Spot Map</h2>' +
            '<div class="spot-legend">' +
              '<span class="legend-dot" style="background:var(--emerald)"></span> Available&nbsp;&nbsp;' +
              '<span class="legend-dot" style="background:var(--rose)"></span> Occupied&nbsp;&nbsp;' +
              '<span class="legend-dot" style="background:var(--amber)"></span> Reserved' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="spot-grid-container">' +
          '<div class="spot-grid" id="spot-grid">' + buildSpotGridCells(spots) + '</div>' +
        '</div>' +
      '</div>' +

      /* Quick Stats */
      '<div class="card quick-stats-card">' +
        '<div class="card-img-header" style="background-image:url(\'/images/map-bg.png\');background-size:cover;height:112px">' +
          '<div class="card-img-overlay bottom-fade"></div>' +
          '<div class="card-img-content">' +
            '<h2 class="card-title">' + icon('arrows') + ' Quick Stats</h2>' +
          '</div>' +
        '</div>' +
        '<div class="quick-stats-body">' +
          qsRow('Vehicles Today', stats ? stats.todayVehicles : '—', '', 'qs-vehicles') +
          qsRow('Reserved Spots', stats ? stats.reservedSpots : '—', 'blue', 'qs-reserved') +
          qsRow('Maintenance', stats ? stats.maintenanceSpots : '—', 'amber', 'qs-maintenance') +
          qsRow('Occupied', stats ? stats.occupiedSpots : '—', 'rose', 'qs-occupied', true) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function statCard(cls, title, value, ico, iconCls, id, sub) {
  return '<div class="stat-card ' + cls + '">' +
    '<div class="stat-header">' +
      '<span class="stat-title">' + title + '</span>' +
      '<span class="stat-icon-bg ' + iconCls + '">' + ico + '</span>' +
    '</div>' +
    '<div><div class="stat-value" id="' + id + '">' + value + '</div>' +
    (sub ? '<div class="stat-sub">' + sub + '</div>' : '') +
    '</div>' +
  '</div>';
}

function qsRow(label, value, colorCls, id, last) {
  return '<div class="qs-row' + (last ? ' last' : '') + '">' +
    '<span class="qs-label">' + label + '</span>' +
    '<span class="qs-value ' + (colorCls || '') + '" id="' + id + '">' + value + '</span>' +
  '</div>';
}

/* ENTRY PAGE */
let selectedSpotId = null;
let selectedSpotNumber = '';

async function entryPage(container) {
  const [spots, zones] = await Promise.all([
    apiFetch('/parking-spots').catch(function() { return []; }),
    apiFetch('/parking-zones').catch(function() { return []; }),
  ]);

  selectedSpotId = null;
  selectedSpotNumber = '';

  container.innerHTML = buildEntryHTML(zones);

  // Vehicle type buttons
  container.querySelectorAll('.vtype-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.vtype-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('vtype-hidden').value = btn.dataset.value;
      redrawSpotPicker(spots, btn.dataset.value, activeZoneId());
    });
  });

  // Zone tabs
  container.querySelectorAll('.zone-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      container.querySelectorAll('.zone-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      const vt = document.getElementById('vtype-hidden').value || 'car';
      redrawSpotPicker(spots, vt, activeZoneId());
    });
  });

  // Refresh button
  container.querySelector('.zone-tab-refresh').addEventListener('click', async function() {
    const fresh = await apiFetch('/parking-spots').catch(function() { return spots; });
    const vt = document.getElementById('vtype-hidden').value || 'car';
    redrawSpotPicker(fresh, vt, activeZoneId());
  });

  // Initial render
  redrawSpotPicker(spots, 'car', null);

  // Form submit
  document.getElementById('entry-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const plate = document.getElementById('vehicle-plate').value.trim();
    const vtype = document.getElementById('vtype-hidden').value || 'car';
    const driver = document.getElementById('driver-name').value.trim();

    if (!plate) { showToast('Error', 'License plate is required', 'error'); return; }
    if (!selectedSpotId) { showToast('Error', 'Please select a spot from the floor plan', 'error'); return; }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing Entry…';

    try {
      await apiFetch('/parking-sessions', {
        method: 'POST',
        body: JSON.stringify({
          spotId: selectedSpotId,
          vehiclePlate: plate.toUpperCase(),
          vehicleType: vtype,
          driverName: driver || undefined,
        }),
      });
      showToast('Session Started', 'Vehicle successfully registered and parked.');
      selectedSpotId = null;
      navigate('/active');
    } catch(err) {
      showToast('Entry Failed', err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = icon('check') + ' Select a Spot First';
    }
  });
}

function activeZoneId() {
  const tab = document.querySelector('.zone-tab.active');
  return (tab && tab.dataset.zoneId) ? Number(tab.dataset.zoneId) : null;
}

function isRecommended(spotType, vehicleType) {
  if (vehicleType === 'motorcycle' && spotType === 'compact') return true;
  if (vehicleType === 'car' && spotType === 'standard') return true;
  if (vehicleType === 'truck' && spotType === 'standard') return true;
  if (vehicleType === 'van' && spotType === 'standard') return true;
  return false;
}

function redrawSpotPicker(allSpots, vehicleType, filterZoneId) {
  const grid = document.getElementById('spot-picker-grid');
  if (!grid) return;
  const filtered = filterZoneId ? allSpots.filter(function(s) { return s.zoneId === filterZoneId; }) : allSpots;

  grid.innerHTML = filtered.map(function(spot) {
    const avail = spot.status === 'available';
    const rec = avail && isRecommended(spot.type, vehicleType);
    let cls = 'spot-pick';
    if (!avail) cls += ' spot-pick-occ';
    else if (rec) cls += ' spot-pick-rec';
    else cls += ' spot-pick-avail';
    if (selectedSpotId === spot.id) cls += ' spot-pick-selected';
    return '<div class="' + cls + '" data-id="' + spot.id + '" data-num="' + escHtml(spot.spotNumber) + '" data-zone="' + escHtml(spot.zoneName || '') + '" title="' + escHtml(spot.spotNumber) + ' (' + spot.status + (rec ? ' - Recommended' : '') + ')">' +
      escHtml(spot.spotNumber) + '</div>';
  }).join('');

  grid.querySelectorAll('.spot-pick-avail, .spot-pick-rec').forEach(function(el) {
    el.addEventListener('click', function() {
      selectedSpotId = Number(el.dataset.id);
      selectedSpotNumber = el.dataset.num;

      grid.querySelectorAll('.spot-pick').forEach(function(s) { s.classList.remove('spot-pick-selected'); });
      el.classList.add('spot-pick-selected');

      const info = document.getElementById('selected-spot-info');
      if (info) info.innerHTML = '<span class="badge-primary">' + escHtml(selectedSpotNumber) + '</span>&nbsp;<span class="text-muted">' + escHtml(el.dataset.zone) + '</span>';

      const btn = document.getElementById('submit-btn');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = icon('check') + ' Grant Entry — Spot ' + escHtml(selectedSpotNumber);
      }
    });
  });
}

function buildEntryHTML(zones) {
  return '<div class="page-space" style="max-width:900px;margin:0 auto">' +

    /* Hero */
    '<div class="hero-banner hero-sm">' +
      '<img src="/images/vip-zone.png" alt="VIP" class="hero-img" onerror="this.style.opacity=0.2">' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-content">' +
        '<div class="hero-badge">' + icon('sparkles') + ' Smart Visual Spot Picker</div>' +
        '<h1 class="hero-title" style="font-size:1.8rem">Vehicle Entry</h1>' +
        '<p class="hero-sub">Click directly on the floor plan to pick your spot.</p>' +
      '</div>' +
    '</div>' +

    '<form id="entry-form" class="space-y">' +
      /* Step 1 */
      '<div class="card padded">' +
        '<div class="step-header">' +
          '<div class="step-num">1</div>' +
          '<h2 class="step-title">Vehicle Information</h2>' +
        '</div>' +
        '<div class="vtype-grid">' +
          vtypeBtn('car', 'Car', 'car', true) +
          vtypeBtn('motorcycle', 'Motorcycle', 'bike', false) +
          vtypeBtn('van', 'Van', 'bus', false) +
          vtypeBtn('truck', 'Truck', 'truck', false) +
        '</div>' +
        '<input type="hidden" id="vtype-hidden" value="car">' +
        '<div class="form-row-2">' +
          '<div class="form-group">' +
            '<label class="form-label">License Plate <span class="required">*</span></label>' +
            '<input type="text" id="vehicle-plate" class="form-input plate-input" placeholder="e.g. ABC-1234" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Driver Name (Optional)</label>' +
            '<input type="text" id="driver-name" class="form-input" placeholder="Enter driver\'s name">' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Step 2: Visual Spot Picker */
      '<div class="card padded">' +
        '<div class="step-header">' +
          '<div class="step-num">2</div>' +
          '<div>' +
            '<h2 class="step-title">Pick Your Spot <span class="unique-badge">✦ Unique Feature</span></h2>' +
            '<p class="step-sub">Glowing spots = recommended for your vehicle type. Click any green spot.</p>' +
          '</div>' +
        '</div>' +
        '<div class="selected-spot-display" id="selected-spot-info"><span class="text-muted">No spot selected yet</span></div>' +
        '<div class="zone-tabs">' +
          '<button type="button" class="zone-tab active" data-zone-id="">All Zones</button>' +
          zones.map(function(z) {
            return '<button type="button" class="zone-tab" data-zone-id="' + z.id + '">' + escHtml(z.name) + '</button>';
          }).join('') +
          '<button type="button" class="zone-tab-refresh">' + icon('refresh') + ' Refresh</button>' +
        '</div>' +
        '<div class="spot-legend-sm">' +
          '<span class="legend-item"><span class="legend-dot-sm avail"></span> Available</span>' +
          '<span class="legend-item"><span class="legend-dot-sm occ"></span> Occupied</span>' +
          '<span class="legend-item"><span class="legend-dot-sm res"></span> Reserved</span>' +
          '<span class="legend-item"><span class="legend-dot-sm rec"></span> Recommended</span>' +
        '</div>' +
        '<div class="spot-picker-wrap"><div id="spot-picker-grid" class="spot-picker-grid"></div></div>' +
      '</div>' +

      '<div class="form-submit">' +
        '<button type="submit" id="submit-btn" class="btn btn-primary btn-lg" disabled>' +
          icon('check') + ' Select a Spot First' +
        '</button>' +
      '</div>' +
    '</form>' +
  '</div>';
}

function vtypeBtn(value, label, iconName, active) {
  return '<button type="button" class="vtype-btn' + (active ? ' active' : '') + '" data-value="' + value + '">' +
    icon(iconName) + ' ' + label +
  '</button>';
}

/* ACTIVE SESSIONS PAGE */
async function activeSessionsPage(container) {
  const sessions = await apiFetch('/parking-sessions?status=active').catch(function() { return []; });
  container.innerHTML = buildActiveHTML(sessions);
  attachCheckoutHandlers();

  const timerInterval = setInterval(function() {
    document.querySelectorAll('[data-timer]').forEach(function(el) {
      el.textContent = elapsed(el.dataset.timer);
    });
    document.querySelectorAll('[data-cost]').forEach(function(el) {
      el.textContent = liveCost(el.dataset.cost, Number(el.dataset.rate));
    });
  }, 1000);

  const pollInterval = setInterval(async function() {
    try {
      const ns = await apiFetch('/parking-sessions?status=active');
      const tbody = document.getElementById('sessions-tbody');
      if (tbody) { tbody.innerHTML = buildSessionRows(ns); attachCheckoutHandlers(); }
    } catch(e) {}
  }, 5000);

  return function() { clearInterval(timerInterval); clearInterval(pollInterval); };
}

function attachCheckoutHandlers() {
  document.querySelectorAll('.checkout-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      const id = btn.dataset.id;
      const plate = btn.dataset.plate;
      btn.disabled = true;
      btn.textContent = 'Processing…';
      try {
        const result = await apiFetch('/parking-sessions/' + id + '/checkout', { method: 'POST' });
        showToast('Checkout Successful', 'Vehicle ' + plate + ' exited. Total: ' + formatPKR(result.totalAmount || 0));
        const ns = await apiFetch('/parking-sessions?status=active');
        const tbody = document.getElementById('sessions-tbody');
        if (tbody) { tbody.innerHTML = buildSessionRows(ns); attachCheckoutHandlers(); }
      } catch(e) {
        showToast('Checkout Failed', e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = icon('logout') + ' Checkout';
      }
    });
  });
}

function buildSessionRows(sessions) {
  if (!sessions.length) {
    return '<tr><td colspan="6" class="empty-cell"><div class="empty-state">' +
      icon('car') + '<span>No active parking sessions right now.</span></div></td></tr>';
  }
  return sessions.map(function(s) {
    return '<tr>' +
      '<td><div class="spot-num-badge">' + escHtml(s.spotNumber) + '</div><div class="text-muted">' + escHtml(s.zoneName) + '</div></td>' +
      '<td><span class="mono-badge">' + escHtml(s.vehiclePlate) + '</span><div class="text-muted capitalize">' + s.vehicleType + '</div></td>' +
      '<td>' + formatTime(s.entryTime) + '<div class="text-muted">' + formatDate(s.entryTime) + '</div></td>' +
      '<td class="timer-cell">' + icon('clock') + '<span data-timer="' + s.entryTime + '">' + elapsed(s.entryTime) + '</span></td>' +
      '<td class="cost-cell"><span data-cost="' + s.entryTime + '" data-rate="' + s.hourlyRate + '">' + liveCost(s.entryTime, s.hourlyRate) + '</span></td>' +
      '<td class="text-center"><button class="btn-outline-rose checkout-btn" data-id="' + s.id + '" data-plate="' + escHtml(s.vehiclePlate) + '">' + icon('logout') + ' Checkout</button></td>' +
    '</tr>';
  }).join('');
}

function buildActiveHTML(sessions) {
  return '<div class="page-space">' +
    '<div class="hero-banner hero-sm">' +
      '<img src="/images/parking-hero.png" alt="Active" class="hero-img" onerror="this.style.opacity=0.2">' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-content">' +
        '<h1 class="hero-title" style="font-size:1.8rem">Active Sessions</h1>' +
        '<p class="hero-sub">Monitor currently parked vehicles and process exits.</p>' +
      '</div>' +
    '</div>' +
    '<div class="card overflow-x">' +
      '<table class="data-table">' +
        '<thead><tr>' +
          '<th>Spot / Zone</th><th>Vehicle</th><th>Entry Time</th>' +
          '<th>Duration</th><th class="text-right">Est. Cost</th><th class="text-center">Action</th>' +
        '</tr></thead>' +
        '<tbody id="sessions-tbody">' + buildSessionRows(sessions) + '</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';
}

/* HISTORY PAGE */
async function historyPage(container) {
  const sessions = await apiFetch('/parking-sessions?status=completed&limit=50').catch(function() { return []; });
  container.innerHTML =
    '<div class="page-space">' +
      '<div><h1 class="page-title">Session History</h1><p class="page-sub">Review past parking sessions and revenue records.</p></div>' +
      '<div class="card overflow-x">' +
        '<table class="data-table">' +
          '<thead><tr>' +
            '<th>Spot / Zone</th><th>Vehicle</th><th>Duration</th><th>Time Window</th><th class="text-right">Amount Paid</th>' +
          '</tr></thead>' +
          '<tbody>' +
            (sessions.length === 0
              ? '<tr><td colspan="5" class="empty-cell"><div class="empty-state">' + icon('history') + '<span>No completed sessions found.</span></div></td></tr>'
              : sessions.map(function(s) {
                  return '<tr>' +
                    '<td><div class="fw-medium">' + escHtml(s.spotNumber) + '</div><div class="text-muted">' + escHtml(s.zoneName) + '</div></td>' +
                    '<td><span class="mono-badge muted">' + escHtml(s.vehiclePlate) + '</span><div class="text-muted capitalize">' + s.vehicleType + '</div></td>' +
                    '<td class="text-muted">' + (s.durationMinutes || 0) + ' mins</td>' +
                    '<td><div class="time-window">' +
                      '<span>' + formatTime(s.entryTime) + '</span>' +
                      icon('arrowRight') +
                      '<span>' + (s.exitTime ? formatTime(s.exitTime) : '—') + '</span>' +
                      '<span class="date-badge">' + formatDate(s.entryTime) + '</span>' +
                    '</div></td>' +
                    '<td class="text-right fw-bold">' + formatPKR(s.totalAmount || 0) + '</td>' +
                  '</tr>';
                }).join('')) +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

/* SPOTS PAGE */
async function spotsPage(container) {
  let spots = await apiFetch('/parking-spots').catch(function() { return []; });
  const zones = await apiFetch('/parking-zones').catch(function() { return []; });
  let filterZone = '';
  let search = '';

  function renderGrid() {
    let filtered = spots;
    if (filterZone) filtered = filtered.filter(function(s) { return String(s.zoneId) === filterZone; });
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(function(s) {
        return s.spotNumber.toLowerCase().includes(q) || (s.vehiclePlate && s.vehiclePlate.toLowerCase().includes(q));
      });
    }
    const g = document.getElementById('spots-grid');
    if (!g) return;
    if (!filtered.length) {
      g.innerHTML = '<div class="empty-full">No parking spots found matching your criteria.</div>';
      return;
    }
    g.innerHTML = filtered.map(function(spot) {
      const sc = spot.status === 'available' ? 'badge-success' :
                 spot.status === 'occupied'  ? 'badge-danger' :
                 spot.status === 'reserved'  ? 'badge-warning' : 'badge-default';
      return '<div class="spot-card">' +
        '<div class="spot-card-header">' +
          '<div class="spot-card-num">' + icon('mappin') + '<span>' + escHtml(spot.spotNumber) + '</span></div>' +
          '<span class="badge ' + sc + '">' + spot.status + '</span>' +
        '</div>' +
        '<div class="spot-card-details">' +
          '<div class="spot-detail"><span class="text-muted">Zone</span><span class="fw-medium">' + escHtml(spot.zoneName || 'Zone ' + spot.zoneId) + '</span></div>' +
          '<div class="spot-detail"><span class="text-muted">Type</span><span class="fw-medium capitalize">' + spot.type + '</span></div>' +
          (spot.vehiclePlate ? '<div class="spot-detail border-top"><span class="text-muted">Vehicle</span><span class="primary-text fw-bold">' + escHtml(spot.vehiclePlate) + '</span></div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  container.innerHTML =
    '<div class="page-space">' +
      '<div class="hero-banner hero-sm">' +
        '<img src="/images/map-bg.png" alt="Parking Spots" class="hero-img" onerror="this.style.opacity=0.2" />' +
        '<div class="hero-overlay"></div>' +
        '<div class="hero-content">' +
          '<div class="hero-badge">' + icon('mappin') + ' Parking Spot Management</div>' +
          '<h1 class="hero-title" style="font-size:1.8rem">Parking Spots</h1>' +
          '<p class="hero-sub">Manage and view all individual parking spaces.</p>' +
        '</div>' +
      '</div>' +
      '<div class="card padded filter-bar">' +
        '<div class="search-wrap">' + icon('search') +
          '<input type="text" id="spot-search" class="form-input search-input" placeholder="Search spot number or vehicle plate…">' +
        '</div>' +
        '<div class="filter-wrap">' + icon('filter') +
          '<select id="zone-filter" class="form-select">' +
            '<option value="">All Zones</option>' +
            zones.map(function(z) { return '<option value="' + z.id + '">' + escHtml(z.name) + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div id="spots-grid" class="spots-card-grid"></div>' +
    '</div>';

  renderGrid();

  document.getElementById('spot-search').addEventListener('input', function(e) { search = e.target.value; renderGrid(); });
  document.getElementById('zone-filter').addEventListener('change', function(e) { filterZone = e.target.value; renderGrid(); });

  const interval = setInterval(async function() {
    try { spots = await apiFetch('/parking-spots'); renderGrid(); } catch(e) {}
  }, 10000);

  return function() { clearInterval(interval); };
}

/* ZONES PAGE */
const ZONE_IMAGES = ['parking-hero.png', 'zone-banner.png', 'vip-zone.png'];

async function zonesPage(container) {
  let zones = await apiFetch('/parking-zones').catch(function() { return []; });
  let showCreate = false;

  container.innerHTML =
    '<div class="page-space">' +
      '<div class="page-header-row">' +
        '<div><h1 class="page-title">Parking Zones</h1><p class="page-sub">Manage physical areas and pricing rates.</p></div>' +
        '<button class="btn btn-primary" id="add-zone-btn">' + icon('plus') + ' Add Zone</button>' +
      '</div>' +
      '<div id="zones-content"></div>' +
    '</div>';

  function redraw() {
    const el = document.getElementById('zones-content');
    if (!el) return;

    const formHTML = showCreate ? buildZoneForm() : '';
    const cardsHTML = '<div class="zones-grid">' +
      zones.map(function(zone, i) {
        const occ = zone.totalSpots > 0 ? Math.round((zone.occupiedSpots / zone.totalSpots) * 100) : 0;
        const img = ZONE_IMAGES[i % ZONE_IMAGES.length];
        const barColor = occ > 80 ? 'var(--rose)' : occ > 50 ? 'var(--amber)' : 'var(--emerald)';
        const badgeCls = occ > 80 ? 'badge-occ-danger' : occ > 50 ? 'badge-occ-warn' : 'badge-occ-ok';
        const zLabel = String.fromCharCode(65 + i);
        return '<div class="zone-card">' +
          '<div class="zone-card-img">' +
            '<img src="/images/' + img + '" alt="' + escHtml(zone.name) + '" onerror="this.style.opacity=0.3">' +
            '<div class="zone-img-overlay"></div>' +
            '<div class="zone-label-badge">' + icon('layers') + ' Zone ' + zLabel + '</div>' +
            '<div class="zone-occ-badge ' + badgeCls + '">' + occ + '% Full</div>' +
          '</div>' +
          '<div class="zone-card-body">' +
            '<div><h3 class="zone-name">' + escHtml(zone.name) + '</h3>' +
              (zone.description ? '<p class="zone-desc">' + escHtml(zone.description) + '</p>' : '') +
            '</div>' +
            '<div class="occ-bar-section">' +
              '<div class="occ-bar-label"><span>Occupancy</span><span>' + zone.occupiedSpots + '/' + zone.totalSpots + ' spots</span></div>' +
              '<div class="occ-bar-bg tall"><div class="occ-bar bg-anim" data-w="' + occ + '%" style="width:0%;background:' + barColor + '"></div></div>' +
            '</div>' +
            '<div class="zone-stats-grid">' +
              '<div class="zone-stat"><div class="zone-stat-label">' + icon('mappin') + ' Total</div><div class="zone-stat-val">' + zone.totalSpots + '</div></div>' +
              '<div class="zone-stat emerald"><div class="zone-stat-label emerald">' + icon('car') + ' Free</div><div class="zone-stat-val emerald">' + zone.availableSpots + '</div></div>' +
              '<div class="zone-stat amber"><div class="zone-stat-label amber">₨ Rate</div><div class="zone-stat-val amber">PKR ' + zone.hourlyRate + '/h</div></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';

    el.innerHTML = formHTML + cardsHTML;
    setTimeout(function() {
      document.querySelectorAll('.bg-anim').forEach(function(b) { b.style.width = b.dataset.w; });
    }, 50);

    if (showCreate) {
      document.getElementById('close-create-btn').addEventListener('click', function() { showCreate = false; redraw(); });
      document.getElementById('zone-create-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('zone-save-btn');
        btn.disabled = true; btn.textContent = 'Creating…';
        try {
          await apiFetch('/parking-zones', {
            method: 'POST',
            body: JSON.stringify({
              name: document.getElementById('znew-name').value,
              description: document.getElementById('znew-desc').value || undefined,
              hourlyRate: Number(document.getElementById('znew-rate').value),
            }),
          });
          showToast('Zone Created', 'Successfully added new parking zone.');
          zones = await apiFetch('/parking-zones').catch(function() { return zones; });
          showCreate = false;
          redraw();
        } catch(err) {
          showToast('Error', err.message, 'error');
          btn.disabled = false; btn.textContent = 'Save Zone';
        }
      });
    }
  }

  document.getElementById('add-zone-btn').addEventListener('click', function() { showCreate = true; redraw(); });

  redraw();

  const interval = setInterval(async function() {
    try { zones = await apiFetch('/parking-zones'); redraw(); } catch(e) {}
  }, 10000);

  return function() { clearInterval(interval); };
}

function buildZoneForm() {
  return '<div class="card padded create-zone-form" style="margin-bottom:24px">' +
    '<button type="button" class="close-btn" id="close-create-btn">' + icon('x') + '</button>' +
    '<h3 class="form-section-title">Create New Zone</h3>' +
    '<form id="zone-create-form" class="space-y">' +
      '<div class="form-row-2">' +
        '<div class="form-group"><label class="form-label">Zone Name</label>' +
          '<input type="text" id="znew-name" class="form-input" placeholder="e.g. North Wing Level 1" required></div>' +
        '<div class="form-group"><label class="form-label">Hourly Rate (PKR)</label>' +
          '<input type="number" id="znew-rate" class="form-input" placeholder="150" min="10" required></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Description (Optional)</label>' +
        '<input type="text" id="znew-desc" class="form-input" placeholder="Brief details…"></div>' +
      '<button type="submit" class="btn btn-primary" id="zone-save-btn">Save Zone</button>' +
    '</form>' +
  '</div>';
}
