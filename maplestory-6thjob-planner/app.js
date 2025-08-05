function handleMapleranksLink() {
  const url = document.getElementById('mapleranksUrl').value.trim();
  if (!url.includes('/u/')) {
    alert('Please enter a valid MapleRanks URL');
    return;
  }

  const ign = url.split('/u/')[1];
  localStorage.setItem('ms_tracker_ign', ign);
  localStorage.setItem('ms_tracker_source', 'mapleranks');

  fetchMapleranksData(ign).then(() => {
    window.location.href = 'dashboard.html';
  });
}

async function fetchMapleranksData(ign) {
  const proxiedUrl = `https://corsproxy.io/?https://mapleranks.com/u/${ign}`;
  const res = await fetch(proxiedUrl);
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Sprite
  const img = doc.querySelector('img.card-img-top')?.src;
  if (img) localStorage.setItem('ms_tracker_sprite', img);

  // Clase + mundo
  const fullClass = doc.querySelector('p.card-text.mb-0')?.textContent.trim();
  if (fullClass) {
    const [job, ...worldParts] = fullClass.split(' in ');
    localStorage.setItem('ms_tracker_class', job.trim());
    localStorage.setItem('ms_tracker_world', worldParts.join(' in ').trim());
  }

  // Nivel
  const levelText = doc.querySelector('h5.card-text')?.textContent;
  const levelMatch = levelText?.match(/Lv\.?\s?(\d+)\s?\(([\d.]+)%\)/);

  if (levelMatch) {
    localStorage.setItem('ms_tracker_level', levelMatch[1]);
    localStorage.setItem('ms_tracker_progress', levelMatch[2]);
  }
}

function handleManualEntry() {
  const name = document.getElementById('manualName').value.trim();
  const className = document.getElementById('manualClass').value;
  if (!name || !className) {
    alert('Please complete both fields.');
    return;
  }

  localStorage.setItem('ms_tracker_ign', name);
  localStorage.setItem('ms_tracker_class', className);
  localStorage.setItem('ms_tracker_source', 'manual');
  window.location.href = 'dashboard.html';
}
