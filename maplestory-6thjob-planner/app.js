// ✅ Manejo del botón de ingresar MapleRanks
async function handleMapleranksLink() {
  const ign = document.getElementById('mapleranksUrl').value.trim();
  if (!ign) {
    showToast("⚠️ Please enter your IGN", "#F59E0B");
    return;
  }

  localStorage.setItem('ms_tracker_ign', ign);
  localStorage.setItem('ms_tracker_source', 'mapleranks');

  const data = await fetchMapleranksData(ign); // ahora devuelve el objeto con datos

  if (data?.class) {
    saveCharacterData(ign, data);
    window.location.href = 'dashboard.html';
  } else {
    showToast("❌ Character not found on mapleranks or banned.", "#DC2626");
    return;
  }
}

// ✅ Obtener datos desde MapleRanks y devolverlos
async function fetchMapleranksData(ign) {
  const safeIgn = encodeURIComponent(ign.trim());
  const proxiedUrl = `https://corsproxy.io/?https://mapleranks.com/u/${safeIgn}`;

  try {
    const res = await fetch(proxiedUrl, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const data = { sprite: '', class: '', world: '', level: '?', progress: '?' };

    const img = doc.querySelector('img.card-img-top')?.src;
    if (img) data.sprite = img;

    const fullClass = doc.querySelector('p.card-text.mb-0')?.textContent?.trim();
    if (fullClass) {
      const [job, ...worldParts] = fullClass.split(' in ');
      data.class = (job || '').trim();
      data.world = worldParts.join(' in ').trim();
    }

    const levelText = doc.querySelector('h5.card-text')?.textContent || '';
    const levelMatch = levelText.match(/Lv\.?\s?(\d+)\s?\(([\d.]+)%\)/);
    if (levelMatch) {
      data.level = levelMatch[1];
      data.progress = levelMatch[2];
    }

    return data;
  } catch (err) {
    console.error('MapleRanks fetch error:', err);
    return { sprite: '', class: '', world: '', level: '?', progress: '?' };
  }
}


function handleManualEntry() {
  const name = document.getElementById('manualName').value.trim();
  const className = document.getElementById('manualClass').value;

  if (!name || !className) {
    showToast("⚠️ Please complete both fields.", "#F59E0B");
    return;
  }


  const gifOptions = [
    'https://media.tenor.com/Bw6szS08q3gAAAAC/maplestory.gif',
    'https://media.tenor.com/GAPrwr7XxI4AAAAC/maplestory-slime.gif',
    'https://media.tenor.com/O_fCzCyEwZ8AAAAd/maplestory.gif',
    'https://media.tenor.com/RtTjv4j_q9wAAAAC/maplestory-attack.gif'
  ];

  const randomGif = gifOptions[Math.floor(Math.random() * gifOptions.length)];

  const data = {
    class: className,
    world: 'Manual Entry',
    level: '?',
    progress: '?',
    sprite: randomGif,
  };

  localStorage.setItem('ms_tracker_ign', name);
  localStorage.setItem('ms_tracker_source', 'manual');

  saveCharacterData(name, data);
  window.location.href = 'dashboard.html';
}


function showToast(message, bgColor = "#374151") {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "right",
    backgroundColor: bgColor,
    stopOnFocus: true
  }).showToast();
}


function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const messageEl = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    messageEl.textContent = message;
    modal.classList.remove("hidden");

    const cleanup = () => {
      modal.classList.add("hidden");
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    };

    const onYes = () => {
      cleanup();
      resolve(true);
    };

    const onNo = () => {
      cleanup();
      resolve(false);
    };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}


// Abre/cierra modal
function openAddCharacterModal() {
  const m = document.getElementById('addCharModal');
  if (!m) return;
  resetAddCharForm();
  m.classList.remove('hidden');
}
function closeAddCharacterModal() {
  const m = document.getElementById('addCharModal');
  if (!m) return;
  m.classList.add('hidden');
}
function resetAddCharForm() {
  const form = document.getElementById('addCharForm');
  form?.reset();

  // Asegurar que el toggle quede desmarcado y campos manuales ocultos
  const manualToggle = document.getElementById('manualToggle');
  if (manualToggle) manualToggle.checked = false;

  const manualFields = document.getElementById('manualFields');
  manualFields?.classList.add('hidden');

  // Limpiar status y dataset
  const st = document.getElementById('mrStatus');
  if (st) { st.classList.add('hidden'); st.textContent = ''; }
  if (form?.dataset) { form.dataset.sprite = ''; form.dataset.progress = ''; }
}

// Toggle entrada manual
function toggleManualInputs(enabled) {
  const box = document.getElementById('manualFields');
  if (box) box.classList.toggle('hidden', !enabled);
}

// Toast helper
function toast(msg, type = 'info') {
  const colors = { info: '#3B82F6', success: '#10B981', warn: '#F59E0B', error: '#EF4444' };
  if (window.Toastify) {
    Toastify({ text: msg, duration: 3500, gravity: 'top', position: 'right', backgroundColor: colors[type] || colors.info }).showToast();
  } else {
    console[type === 'error' ? 'error' : 'log'](msg);
    alert(msg);
  }
}

// ✅ Botón Buscar (MapleRanks)
// ✅ Buscar en MapleRanks (no activa manual automáticamente)
async function onMapleRanksSearch() {
  const ignInput = document.getElementById('addIgn');
  const status = document.getElementById('mrStatus');
  const form = document.getElementById('addCharForm');
  if (!ignInput || !status) return;

  const ign = ignInput.value.trim();
  if (!ign) return toast('Ingresa un IGN primero.', 'warn');

  try {
    status.classList.remove('hidden');
    status.textContent = 'Buscando en MapleRanks...';

    const data = await fetchMapleranksData(ign);

    if (!data || (!data.class && !data.world && !data.sprite)) {
      status.textContent = 'No se encontró info para ese IGN.';
      return toast('No se encontró info en MapleRanks.', 'warn');
    }

    // Rellenar campos, pero NO mostrar la sección manual ni marcar el toggle
    if (data.class) document.getElementById('addClass').value = data.class;
    if (data.world) document.getElementById('addWorld').value = data.world;
    if (data.level && !Number.isNaN(+data.level)) {
      document.getElementById('addLevel').value = parseInt(data.level, 10);
    } else {
      document.getElementById('addLevel').value = '';
    }
    // Guardar sprite/progress en dataset para el submit
    if (form) {
      form.dataset.sprite = data.sprite || '';
      form.dataset.progress = data.progress || '?';
    }

    // Asegurar que la sección manual quede OCULTA y el toggle desmarcado
    const manualToggle = document.getElementById('manualToggle');
    if (manualToggle) manualToggle.checked = false;
    toggleManualInputs(false);

    status.textContent = 'Datos cargados desde MapleRanks ✅';
    toast('Autocompletado con MapleRanks.', 'success');
  } catch (err) {
    console.error(err);
    status.textContent = 'Error al consultar MapleRanks.';
    toast('Error al consultar MapleRanks.', 'error');
  }
}
// ✅ Guardar y recargar página
document.getElementById('addCharForm')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const ign = (document.getElementById('addIgn')?.value || '').trim();
  const type = document.getElementById('addType')?.value || '';
  if (!ign) return toast('IGN es obligatorio.', 'warn');
  if (!type) return toast('Selecciona un Type.', 'warn');

  const _class = document.getElementById('addClass')?.value || '';
  const _world = document.getElementById('addWorld')?.value || '';
  const _level = parseInt(document.getElementById('addLevel')?.value || '0', 10) || null;

  const form = document.getElementById('addCharForm');
  const sprite = form?.dataset?.sprite || '';
  const progress = form?.dataset?.progress || '?';

  const characters = JSON.parse(localStorage.getItem('characters') || '{}');

  if (characters[ign]) return toast('Ese IGN ya existe. Elige otro.', 'warn');
  console.log('[AddChar] Guardado OK → recarga');
  toast('Personaje agregado ✅', 'success');
  // recarga primero
  setTimeout(() => {
    const url = new URL(window.location.href.split('#')[0]);
    url.searchParams.set('_ts', Date.now());
    window.location.replace(url.toString());
  }, 50);

  // cerrar modal sin bloquear
  try { closeAddCharacterModal(); } catch (_) { }
  characters[ign] = { class: _class, world: _world, level: _level ?? '?', progress: progress || '?', sprite: sprite || '', type };
  localStorage.setItem('characters', JSON.stringify(characters));
  localStorage.setItem('currentCharacter', ign);

  toast('Personaje agregado ✅', 'success');
  closeAddCharacterModal();
  location.reload();
});

// Exponer a window
window.openAddCharacterModal = openAddCharacterModal;
window.closeAddCharacterModal = closeAddCharacterModal;
window.toggleManualInputs = toggleManualInputs;
window.onMapleRanksSearch = onMapleRanksSearch;

// Helpers
function safeParse(v) { try { return JSON.parse(v); } catch { return null; } }

// 🔄 Migrar legacy (si existe) a la estructura nueva
function tryMigrateLegacy() {
  if (localStorage.getItem('characters')) return; // ya hay nueva estructura
  const legacyIgn = localStorage.getItem('ms_tracker_ign');
  if (!legacyIgn) return;

  const legacySrc = localStorage.getItem('ms_tracker_source');
  const characters = {};
  characters[legacyIgn] = {
    class: 'Unknown',
    world: legacySrc === 'manual' ? 'Manual Entry' : '',
    level: '?',
    progress: '?',
    sprite: '',
    type: 'main'
  };
  localStorage.setItem('characters', JSON.stringify(characters));
  localStorage.setItem('currentCharacter', legacyIgn);
}

// ✅ Mostrar opciones guardadas si hay cache
document.addEventListener('DOMContentLoaded', () => {
  tryMigrateLegacy();

  const savedOptions = document.getElementById('savedOptions');
  if (!savedOptions) return;

  const characters = safeParse(localStorage.getItem('characters')) || {};
  const hasCharacters = Object.keys(characters).length > 0;
  const hasCurrent = !!localStorage.getItem('currentCharacter');

  if (hasCharacters || hasCurrent) {
    savedOptions.classList.remove('hidden');
  }
});

// ▶️ Continuar con data guardada
function continueWithSavedData() {
  const current = localStorage.getItem('currentCharacter');
  const characters = safeParse(localStorage.getItem('characters')) || {};
  const ign = current || Object.keys(characters)[0];

  if (!ign) {
    Toastify({ text: 'No hay personajes guardados.', duration: 3000, backgroundColor: '#F59E0B' }).showToast();
    return;
  }
  localStorage.setItem('currentCharacter', ign);
  window.location.href = 'dashboard.html';
}

// 🧹 Limpiar data guardada
function clearSavedData() {
  // Si quieres limpieza total, usa localStorage.clear();
  // Aquí solo limpiamos lo relacionado al tracker:
  localStorage.removeItem('characters');
  localStorage.removeItem('currentCharacter');
  localStorage.removeItem('ms_tracker_ign');
  localStorage.removeItem('ms_tracker_source');

  Toastify({ text: 'Datos guardados eliminados.', duration: 2500, backgroundColor: '#EF4444' }).showToast();
  // Oculta el bloque
  const savedOptions = document.getElementById('savedOptions');
  if (savedOptions) savedOptions.classList.add('hidden');
}