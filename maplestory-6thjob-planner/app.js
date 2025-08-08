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
