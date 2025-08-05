// ✅ Manejo del botón de ingresar MapleRanks
async function handleMapleranksLink() {
  const url = document.getElementById('mapleranksUrl').value.trim();
  if (!url.includes('/u/')) {
    alert('Please enter a valid MapleRanks URL');
    return;
  }

  const ign = url.split('/u/')[1];
  localStorage.setItem('ms_tracker_ign', ign);
  localStorage.setItem('ms_tracker_source', 'mapleranks');

  const data = await fetchMapleranksData(ign); // ahora devuelve el objeto con datos

  if (data?.class) {
    saveCharacterData(ign, data);
    window.location.href = 'dashboard.html';
  } else {
    alert('Could not fetch valid data from MapleRanks.');
  }
}

// ✅ Obtener datos desde MapleRanks y devolverlos
async function fetchMapleranksData(ign) {
  const proxiedUrl = `https://corsproxy.io/?https://mapleranks.com/u/${ign}`;
  const res = await fetch(proxiedUrl);
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const data = { sprite: '', class: '', world: '', level: '?', progress: '?' };

  // Sprite
  const img = doc.querySelector('img.card-img-top')?.src;
  if (img) data.sprite = img;

  // Clase + mundo
  const fullClass = doc.querySelector('p.card-text.mb-0')?.textContent.trim();
  if (fullClass) {
    const [job, ...worldParts] = fullClass.split(' in ');
    data.class = job.trim();
    data.world = worldParts.join(' in ').trim();
  }

  // Nivel
  const levelText = doc.querySelector('h5.card-text')?.textContent;
  const levelMatch = levelText?.match(/Lv\.?\s?(\d+)\s?\(([\d.]+)%\)/);
  if (levelMatch) {
    data.level = levelMatch[1];
    data.progress = levelMatch[2];
  }

  return data;
}

// ✅ Manejo del formulario manual
function handleManualEntry() {
  const name = document.getElementById('manualName').value.trim();
  const className = document.getElementById('manualClass').value;
  if (!name || !className) {
    alert('Please complete both fields.');
    return;
  }

  const data = {
    class: className,
    world: '?',
    level: '?',
    progress: '?',
    sprite: ''
  };

  localStorage.setItem('ms_tracker_ign', name);
  localStorage.setItem('ms_tracker_source', 'manual');

  saveCharacterData(name, data);
  window.location.href = 'dashboard.html';
}
