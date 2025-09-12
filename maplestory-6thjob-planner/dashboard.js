let skillsData = null; // ✅ global para cachear el JSON
let costsData = null; // ✅ cache global de costos

// 🔹 Normaliza nombres de skills (ej: "Sol Janus" → "Sol_Janus")
function normalizeSkillName(name) {
  return name
    .trim()
    .replace(/\s+/g, "_")          // espacios → _
    .replace(/[^a-zA-Z0-9_]/g, ""); // quitar caracteres raros
}

// 🔹 Normaliza nombres de clases (ej: "Arch Mage (Ice, Lightning)" → "Arch_Mage_Ice_Lightning")
function normalizeClassName(name) {
  return name
    .trim()
    .replace(/\s+/g, "_")     // espacios → _
    .replace(/[(),]/g, "")    // quitar paréntesis y comas
    .replace(/_{2,}/g, "_");  // evitar dobles __
}

// 🔹 Costos por tipo de skill
const skillCosts = {
  origin: { max: 10, frag: 5, energy: 500 },
  ascent: { max: 10, frag: 5, energy: 500 },
  mastery: { max: 30, frag: 2, energy: 200 },
  boost: { max: 30, frag: 1, energy: 100 },
  common: { max: 30, frag: 1, energy: 100 }
};

async function loadSkills() {
  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  let ign = localStorage.getItem('currentCharacter');
  let char = characters[ign];

  if (!char) {
    const charKeys = Object.keys(characters);

    if (charKeys.length > 0) {
      // seleccionar automáticamente el primero
      ign = charKeys[0];
      char = characters[ign];
      localStorage.setItem('currentCharacter', ign);
    } else {
      Toastify({
        text: "⚠️ No character selected. Please add a character first.",
        duration: 4000,
        gravity: "top",
        position: "right",
        backgroundColor: "#F59E0B", // amarillo
      }).showToast();

      window.location.href = "index.html";
      return;
    }
  }

  try {
    // ✅ cargar skills.json solo la primera vez
    if (!skillsData) {
      const res = await fetch("data/skills.json");
      skillsData = await res.json();
    }
    if (!costsData) {
      const res = await fetch("data/costs.json");
      costsData = await res.json();
    }
    const classData = skillsData[char.class];
    if (!classData) {
      Toastify({
        text: `❌ Class "${char.class}" not found in skills.json`,
        duration: 4000,
        gravity: "top",
        position: "right",
        backgroundColor: "#DC2626",
      }).showToast();
      return;
    }

    // ✅ construir lista final de skills a mostrar (sin duplicados globales)
    const allSkills = [
      ...(classData.firstMastery || []),
      ...(classData.secondMastery || []),
      ...(classData.thirdMastery || []),
      ...(classData.fourthMastery || []),
      ...(classData.boostSkills || []),
      ...(classData.commonSkills || []),
    ];

    const uniqueSkills = [...new Set(allSkills)];
    const skills = uniqueSkills.map((name) => {
      const safeClass = normalizeClassName(char.class);
      const safeName = normalizeSkillName(name);

      return {
        name,
        image: `assets/skills/${safeClass}/Skill_${safeName}.png`,
        maxLevel: 30,
        fragmentCostPerLevel: 1,
        energyCostPerLevel: 100,
      };
    });

  } catch (err) {
    console.error("Error loading skills:", err);
  }

  // Mostrar encabezado con datos del personaje
  document.getElementById('charName').textContent = ign;
  document.getElementById('charClass').textContent = char.class;
  document.getElementById('charLevel').textContent = char.level || '?';
  document.getElementById('charProgress').textContent = char.progress || '?';
  document.getElementById('charWorld').textContent = char.world || '?';
  document.getElementById('charSprite').src = char.sprite || 'assets/manualentry.png';

  const source = localStorage.getItem('ms_tracker_source');
  if (source === 'manual') {
    document.getElementById('charMeta').style.display = 'none';
  } else {
    document.getElementById('charMeta').style.display = '';
  }

  const tbody = document.getElementById('skillsTable');
  tbody.innerHTML = '';

  // Función auxiliar para renderizar grupo de skills
  function renderGroup(title, skillsArr, className, ign, char, renderedSkills, grouped = false, type = "common") {
    if (!skillsArr || skillsArr.length === 0) return;

    // Mastery → una sola fila aunque haya varias skills
    if (grouped) {
      const primarySkill = skillsArr[0];
      const otherSkills = skillsArr.slice(1);

      const normalized = normalizeSkillName(primarySkill);
      if (renderedSkills.has(normalized)) return;
      renderedSkills.add(normalized);

      const currentLevel = char.skills?.[primarySkill] || 0;
      const { maxLevel, frags, energy } = getRemainingCost(type, currentLevel);

      const desiredLevel = char.desired?.[primarySkill] || currentLevel;
      const { frags: fragsToDesired } = getCostToDesired(type, currentLevel, desiredLevel);

      const safeName = normalizeSkillName(primarySkill);

      const headerRow = document.createElement("tr");
      headerRow.innerHTML = `
      <td colspan="6" class="bg-gray-900 text-indigo-400 font-semibold px-4 py-2">
        ${title}
        ${type === "ascent" ? `<span class="text-gray-400 ml-2 text-sm">(🚧 Coming Soon)</span>` : ""}
      </td>
    `;
      tbody.appendChild(headerRow);

      const row = document.createElement("tr");
      row.innerHTML = `
      <td class="px-4 py-2 flex items-center gap-2">
        <img src="assets/skills/${className}/Skill_${safeName}.png" 
             alt="${primarySkill}" class="w-8 h-8 rounded shadow"/>
        <span>${primarySkill}</span>
        ${otherSkills.length > 0 ? `<span class="text-gray-400 text-sm">(+ ${otherSkills.join(", ")})</span>` : ""}
      </td>
      <td class="px-4 py-2">
        <input type="number" min="0" max="${maxLevel}" value="${currentLevel}" 
               onchange="updateSkillLevel('${ign}', '${primarySkill}', this.value)" 
               class="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white">
      </td>
      <td class="px-4 py-2">
        <input type="number" min="${currentLevel}" max="${maxLevel}" value="${desiredLevel}" 
               onchange="updateDesiredLevel('${ign}', '${primarySkill}', this.value)" 
               class="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white">
      </td>
      <td class="px-4 py-2">${fragsToDesired}</td>
      <td class="px-4 py-2">${frags}</td>
      <td class="px-4 py-2">${energy}</td>
    `;
      tbody.appendChild(row);
      return;
    }

    // No grouped (Origin / Ascent / Boost / Common → individuales)
    const uniqueSkills = [...new Set(skillsArr.filter(Boolean))].filter((s) => {
      const normalized = normalizeSkillName(s);
      if (renderedSkills.has(normalized)) return false;
      renderedSkills.add(normalized);
      return true;
    });

    if (uniqueSkills.length === 0) return;

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
    <td colspan="6" class="bg-gray-900 text-indigo-400 font-semibold px-4 py-2">
      ${title}
      ${type === "ascent" ? `<span class="text-gray-400 ml-2 text-sm">(🚧 Coming Soon)</span>` : ""}
    </td>
  `;
    tbody.appendChild(headerRow);

    uniqueSkills.forEach((skillName) => {
      const currentLevel = char.skills?.[skillName] || 0;
      const { maxLevel, frags, energy } = getRemainingCost(type, currentLevel);

      const desiredLevel = char.desired?.[skillName] || currentLevel;
      const { frags: fragsToDesired } = getCostToDesired(type, currentLevel, desiredLevel);

      const safeName = normalizeSkillName(skillName);

      const row = document.createElement("tr");
      row.innerHTML = `
      <td class="px-4 py-2 flex items-center gap-2 ${type === "ascent" ? "text-gray-500" : ""}">
        <img src="assets/skills/${className}/Skill_${safeName}.png" 
             alt="${skillName}" class="w-8 h-8 rounded shadow ${type === "ascent" ? "opacity-50" : ""}"/>
        <span>${skillName}</span>
      </td>
      <td class="px-4 py-2">
        ${type === "ascent"
          ? `<span class="text-gray-500 italic">-</span>`
          : `<input type="number" min="0" max="${maxLevel}" value="${currentLevel}" 
                   onchange="updateSkillLevel('${ign}', '${skillName}', this.value)" 
                   class="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white">`
        }
      </td>
      <td class="px-4 py-2">
        ${type === "ascent"
          ? `<span class="text-gray-500 italic">-</span>`
          : `<input type="number" min="${currentLevel}" max="${maxLevel}" value="${desiredLevel}" 
                   onchange="updateDesiredLevel('${ign}', '${skillName}', this.value)" 
                   class="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white">`
        }
      </td>
      <td class="px-4 py-2">${type === "ascent" ? "-" : fragsToDesired}</td>
      <td class="px-4 py-2">${type === "ascent" ? "-" : frags}</td>
      <td class="px-4 py-2">${type === "ascent" ? "-" : energy}</td>
    `;
      tbody.appendChild(row);
    });
  }

  function updateDesiredLevel(ign, skillName, desiredLevel) {
    const desiredNum = parseInt(desiredLevel);
    if (isNaN(desiredNum)) return;

    const characters = JSON.parse(localStorage.getItem('characters')) || {};
    if (!characters[ign]) return;

    const currentLevel = characters[ign].skills?.[skillName] || 0;

    // 🔹 Validación: Desired < Current
    if (desiredNum < currentLevel) {
      Toastify({
        text: "❌ Cannot be lower than current Lv",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#DC2626",
      }).showToast();

      // 🔹 Restaurar el valor en el input
      setTimeout(() => loadSkills(), 100);
      return;
    }

    characters[ign].desired = characters[ign].desired || {};
    characters[ign].desired[skillName] = desiredNum;
    localStorage.setItem('characters', JSON.stringify(characters));
    loadSkills();
  }

  // 👉 Render dinámico por categorías
  const renderedSkills = new Set();
  const className = char.class;
  const classData = skillsData[className];

  renderGroup("Origin Skill", [classData.originSkill], className, ign, char, renderedSkills, false, "origin");
  renderGroup("Ascent Skill", [classData.ascentSkill], className, ign, char, renderedSkills, false, "ascent");

  renderGroup("First Mastery", classData.firstMastery, className, ign, char, renderedSkills, true, "mastery");
  renderGroup("Second Mastery", classData.secondMastery, className, ign, char, renderedSkills, true, "mastery");
  renderGroup("Third Mastery", classData.thirdMastery, className, ign, char, renderedSkills, true, "mastery");
  renderGroup("Fourth Mastery", classData.fourthMastery, className, ign, char, renderedSkills, true, "mastery");

  renderGroup("Boost Skills", classData.boostSkills, className, ign, char, renderedSkills, false, "boost");
  renderGroup("Common Skills", classData.commonSkills, className, ign, char, renderedSkills, false, "common");
}

function getRemainingCost(type, currentLevel) {
  if (!costsData || !costsData[type]) return { maxLevel: 0, frags: 0, energy: 0 };

  const costTable = costsData[type].levels;
  const max = costsData[type].max;
  let frags = 0;
  let energy = 0;

  for (let lvl = currentLevel + 1; lvl <= max; lvl++) {
    if (costTable[lvl]) {
      frags += costTable[lvl].frags;
      energy += costTable[lvl].energy;
    }
  }

  return { maxLevel: max, frags, energy };
}

// 🔹 NUEVA: calcular costo hasta el desired level
function getCostToDesired(type, currentLevel, desiredLevel) {
  if (!costsData || !costsData[type]) return { frags: 0, energy: 0 };

  const costTable = costsData[type].levels;
  const max = costsData[type].max;

  let frags = 0;
  let energy = 0;
  const target = Math.min(desiredLevel, max);

  for (let lvl = currentLevel + 1; lvl <= target; lvl++) {
    if (costTable[lvl]) {
      frags += costTable[lvl].frags;
      energy += costTable[lvl].energy;
    }
  }

  return { frags, energy };
}

function updateSkillLevel(ign, skillName, level) {
  const levelNum = parseInt(level);
  if (isNaN(levelNum)) return;

  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  if (!characters[ign]) return;

  // 🔹 Guardar Current Lv
  characters[ign].skills = characters[ign].skills || {};
  characters[ign].skills[skillName] = levelNum;

  // 🔹 Asegurar que Desired Lv nunca sea menor que Current Lv
  characters[ign].desired = characters[ign].desired || {};
  if (!characters[ign].desired[skillName] || characters[ign].desired[skillName] < levelNum) {
    characters[ign].desired[skillName] = levelNum;
  }

  localStorage.setItem('characters', JSON.stringify(characters));
  loadSkills();
}


function updateDesiredLevel(ign, skillName, desiredLevel) {
  const desiredNum = parseInt(desiredLevel);
  if (isNaN(desiredNum)) return;

  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  if (!characters[ign]) return;

  const currentLevel = characters[ign].skills?.[skillName] || 0;

  // 🔹 Validación: Desired < Current
  if (desiredNum < currentLevel) {
    Toastify({
      text: "❌ Cannot be lower than current Lv",
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: "#DC2626",
    }).showToast();

    // 🔹 Restaurar el valor en el input
    setTimeout(() => loadSkills(), 100);
    return;
  }

  characters[ign].desired = characters[ign].desired || {};
  characters[ign].desired[skillName] = desiredNum;
  localStorage.setItem('characters', JSON.stringify(characters));
  loadSkills();
}

loadSkills();


async function deleteCurrentCharacter() {
  const ign = localStorage.getItem('currentCharacter');
  if (!ign) return showToast('No hay personaje activo.', 'error');

  const confirmed = await showConfirm(`Are you sure you want to delete ${ign}?`);
  if (!confirmed) {
    showToast('❌ Eliminación cancelada.', 'info');
    return;
  }

  try {
    const characters = JSON.parse(localStorage.getItem('characters') || '{}');
    delete characters[ign];
    localStorage.setItem('characters', JSON.stringify(characters));

    // calcular siguiente (por prioridad si tienes helper)
    let nextIgn = null;
    if (typeof sortCharactersForDropdown === 'function') {
      const remainingSorted = sortCharactersForDropdown(characters);
      nextIgn = remainingSorted[0]?.[0] || null;
    } else {
      const remainingKeys = Object.keys(characters);
      nextIgn = remainingKeys[0] || null;
    }

    const remainingCount = Object.keys(characters).length;

    if (remainingCount > 0 && nextIgn) {
      localStorage.setItem('currentCharacter', nextIgn);
      showToast(`🗑️ ${ign} eliminado ✅`, 'success');
      setTimeout(() => location.reload(), 600);   // 👈 recarga, NO redirige
    } else {
      localStorage.removeItem('currentCharacter');
      showToast(`🗑️ ${ign} eliminado ✅`, 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 600); // 👈 solo si no quedan
    }
  } catch (err) {
    console.error(err);
    showToast('No se pudo eliminar. Intenta de nuevo.', 'error');
  }
}


function goToAddCharacter() {
  window.location.href = 'index.html';
}

function updateCharacterPreview(data) {
  document.getElementById('previewSprite').src = data.sprite || '';
  document.getElementById('previewName').textContent = data.name || 'IGN';
  document.getElementById('previewClass').textContent = `${data.class || 'Class'} – ${data.world || 'World'}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  const current = localStorage.getItem('currentCharacter');
  renderCustomDropdown(characters, current);
});

document.addEventListener('DOMContentLoaded', () => {
  const savedOptions = document.getElementById('savedOptions');
  const characters = localStorage.getItem('characters');
  if (characters) {
    savedOptions.classList.remove('hidden');
  }
});
// Nuevo bloque para manejar el submit del modal
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addCharForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const ign = (document.getElementById('addIgn')?.value || '').trim();
    const type = document.getElementById('addType')?.value || '';
    if (!ign) return toast('IGN es obligatorio.', 'warn');
    if (!type) return toast('Selecciona un Type.', 'warn');

    const _class = document.getElementById('addClass')?.value || '';
    const _world = document.getElementById('addWorld')?.value || '';
    const _level = parseInt(document.getElementById('addLevel')?.value || '0', 10) || null;

    const sprite = form?.dataset?.sprite || '';
    const progress = form?.dataset?.progress || '?';

    const characters = JSON.parse(localStorage.getItem('characters') || '{}');
    if (characters[ign]) return toast('Ese IGN ya existe. Elige otro.', 'warn');

    characters[ign] = { class: _class, world: _world, level: _level ?? '?', progress: progress || '?', sprite: sprite || '', type };
    localStorage.setItem('characters', JSON.stringify(characters));
    localStorage.setItem('currentCharacter', ign);

    console.log('[AddChar] Guardado OK → recarga dura');
    toast('Personaje agregado ✅', 'success');

    // 🚀 HAZ LA RECARGA YA
    hardReload();

    // Cerrar modal SIN bloquear la recarga si algo falla
    try { closeAddCharacterModal(); } catch (_) { }
  });
});


function hardReload() {
  try {
    // 1) Recarga dura con query param anti-cache
    const url = new URL(window.location.href.split('#')[0]);
    url.searchParams.set('_ts', Date.now());
    window.location.replace(url.toString());

    // 2) Fallback por si el navegador ignora replace()
    setTimeout(() => { window.location.assign(url.toString()); }, 250);

    // 3) Último fallback
    setTimeout(() => { history.go(0); }, 500);
  } catch (e) {
    console.error('reload error:', e);
    window.location.reload(); // plan Z
  }
}
// 👑 Prioridad y helpers
const TYPE_PRIORITY = {
  'main': 1,
  'second main': 2,
  'champion mule': 3,
  'ctene mule': 4
};
function normalizeType(t) {
  if (!t) return '';
  const n = String(t).trim().toLowerCase();
  if (n === 'second' || n === 'second-main' || n === 'second_main') return 'second main';
  if (n === 'champion') return 'champion mule';
  if (n === 'mule' || n === 'ctene' || n === 'ctene-mule') return 'ctene mule';
  return n;
}
function typePriority(t) {
  return TYPE_PRIORITY[normalizeType(t)] ?? 99;
}
// 🧠 Ordena un objeto characters por prioridad de type, luego por nombre
function sortCharactersForDropdown(characters) {
  const entries = Object.entries(characters); // [ [ign, data], ... ]

  entries.sort((a, b) => {
    const [igna, aData] = a;
    const [ignb, bData] = b;
    const pa = typePriority(aData?.type);
    const pb = typePriority(bData?.type);

    if (pa !== pb) return pa - pb;

    // Empate: ordenar por IGN (alfabético)
    return igna.localeCompare(ignb, undefined, { sensitivity: 'base' });
  });

  return entries; // devuelvo la lista ordenada
}


function renderCustomDropdown(characters, currentIgn) {
  const dropdownButton = document.getElementById('dropdownButton');
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownList = document.getElementById('dropdownList');

  dropdownSelected.textContent = currentIgn || 'Select Character';
  dropdownList.innerHTML = '';

  dropdownList.classList.add(
    'max-h-72', 'overflow-auto', 'bg-gray-800', 'border', 'border-gray-700', 'rounded', 'mt-1'
  );

  dropdownList.addEventListener('click', (e) => e.stopPropagation());

  Object.keys(characters).forEach((ign) => {
    const char = characters[ign];

    const option = document.createElement('div');
    option.className = 'grid grid-cols-[28px_1fr_140px_24px] items-center gap-3 px-4 py-2 hover:bg-gray-700';
    option.addEventListener('click', () => {
      localStorage.setItem('currentCharacter', ign);
      location.reload();
    });

    // === AVATAR: [overflow-hidden] -> [zoomWrapper con scale/offset] -> [img con animación] ===
    const avatar = document.createElement('div');
    avatar.className = 'w-7 h-7 rounded overflow-hidden';

    const zoomWrapper = document.createElement('div');
    zoomWrapper.className = 'w-full h-full';
    // Ajusta estos valores hasta que sea SOLO cabeza:
    zoomWrapper.style.transformOrigin = 'center top';
    zoomWrapper.style.transform = 'scale(2.1) translateY(-3px)';

    const img = document.createElement('img');
    img.src = char.sprite || 'assets/manualentry.png';
    img.alt = ign;
    img.className = 'w-full h-full object-cover animate-float';
    img.style.animationDelay = `${Math.random() * 1.5}s`;

    zoomWrapper.appendChild(img);
    avatar.appendChild(zoomWrapper);
    option.appendChild(avatar);

    // 2) Nombre
    const name = document.createElement('span');
    name.textContent = ign;
    name.className = 'min-w-0 truncate';
    option.appendChild(name);

    // 3) Select tipo
    const typeSelect = document.createElement('select');
    typeSelect.className = 'bg-gray-800 border border-gray-600 text-white text-xs rounded px-2 py-1 w-[140px]';
    [
      { value: 'main', label: 'Main' },
      { value: 'second', label: 'Second Main' },
      { value: 'mule', label: 'Ctene Mule' },
      { value: 'champion', label: 'Champion Mule' },
    ].forEach(({ value, label }) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      if (characters[ign]?.type === value) opt.selected = true;
      typeSelect.appendChild(opt);
    });
    typeSelect.addEventListener('click', (e) => e.stopPropagation());
    typeSelect.addEventListener('mousedown', (e) => e.stopPropagation());
    typeSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      updateCharacterType(ign, e.target.value);
    });
    option.appendChild(typeSelect);

    // 4) Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '✕';
    deleteBtn.setAttribute('title', 'Delete');
    deleteBtn.className = 'w-6 h-6 leading-6 text-center text-red-500 hover:text-red-700 text-sm';

    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();

      // Usa tu modal de confirmación; si no lo tienes, cambia por confirm()
      const confirmed = await showConfirm(`Are you sure you want to delete ${ign}?`);
      if (!confirmed) {
        showToast('❌ Eliminación cancelada.', 'info');
        return;
      }

      const chars = JSON.parse(localStorage.getItem('characters') || '{}');
      delete chars[ign];
      localStorage.setItem('characters', JSON.stringify(chars));

      // Actualiza currentCharacter
      const remaining = Object.keys(chars);
      if (localStorage.getItem('currentCharacter') === ign) {
        if (remaining.length > 0) {
          localStorage.setItem('currentCharacter', remaining[0]);
        } else {
          localStorage.removeItem('currentCharacter');
        }
      }

      showToast(`🗑️ ${ign} eliminado correctamente.`, 'success');

      // Deja que se vea el toast y refresca
      setTimeout(() => {
        if (remaining.length) {
          location.reload();
        } else {
          window.location.href = 'index.html';
        }
      }, 600);
    });

    option.appendChild(deleteBtn);
    dropdownList.appendChild(option);
  });

  dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownList.classList.toggle('hidden');
  });

  window.addEventListener('click', (e) => {
    if (!dropdownButton.contains(e.target) && !dropdownList.contains(e.target)) {
      dropdownList.classList.add('hidden');
    }
  });
}


// 🎨 Aplica color según tipo seleccionado
function applyTypeStyle(select, type) {
  select.className = 'text-sm px-2 py-1 rounded focus:outline-none';

  const styles = {
    main: 'bg-green-200 text-green-900',
    second: 'bg-blue-200 text-blue-900',
    ctene: 'bg-purple-200 text-purple-900',
    champion: 'bg-yellow-200 text-yellow-900',
  };

  if (styles[type]) {
    select.className += ' ' + styles[type];
  }
}


function goHome() {
  window.location.href = 'index.html';
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


function getTypeLabel(type) {
  const labels = {
    main: 'Main',
    second: 'Second Main',
    ctene: 'Ctene Mule',
    champion: 'Champion Mule'
  };
  return labels[type] || '';
}

function updateCharacterType(ign, newType) {
  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  if (!characters[ign]) return;

  characters[ign].type = newType;
  localStorage.setItem('characters', JSON.stringify(characters));
}

function applyHeadCrop(imgEl, { sizeClass = 'w-16 h-16', scale = 1.9, offsetY = -8 } = {}) {
  // Crear contenedor con overflow-hidden
  const wrapper = document.createElement('div');
  wrapper.className = `${sizeClass} rounded shadow overflow-hidden`;

  // Reemplazar en el DOM
  const parent = imgEl.parentNode;
  parent.replaceChild(wrapper, imgEl);
  wrapper.appendChild(imgEl);

  // Estilos del <img> para hacer zoom y enfoque arriba
  imgEl.classList.remove('w-16', 'h-16'); // por si venían del HTML
  imgEl.classList.add('w-full', 'h-full');
  imgEl.style.objectFit = 'cover';
  imgEl.style.transformOrigin = 'center top';
  imgEl.style.transform = `scale(${scale}) translateY(${offsetY}px)`;
}


async function renderCharacterHeader(charData) {
  const spriteEl = document.getElementById('charSprite');

  // Setea la imagen y los textos
  spriteEl.src = charData.spriteUrl; // la URL que te da Mapleranks
  document.getElementById('charName').textContent = charData.name;
  document.getElementById('charClass').textContent = charData.class;
  document.getElementById('charLevel').textContent = charData.level;
  document.getElementById('charProgress').textContent = charData.progressPct;
  document.getElementById('charWorld').textContent = charData.world;

  // Cuando la imagen carga, aplicamos el recorte de “cabeza”
  spriteEl.onload = () => applyHeadCrop(spriteEl, {
    // puedes ajustar estos valores a tu gusto
    sizeClass: 'w-16 h-16',
    scale: 2.0,     // más grande = más zoom
    offsetY: -10    // negativo sube el encuadre, positivo lo baja
  });
}


function openAddCharacterModal() {
  const m = document.getElementById('addCharModal');
  m.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('addIgn')?.focus(), 0);
}
function closeAddCharacterModal() {
  document.getElementById('addCharModal')?.classList?.add('hidden');
}

// Cerrar modal con click fuera y ESC
(function wireAddModalClose() {
  const modal = document.getElementById('addCharModal');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAddCharacterModal(); });
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('hidden') && e.key === 'Escape') closeAddCharacterModal();
  });
})();

// Guardar nuevo character
document.getElementById('addCharForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const ign = document.getElementById('addIgn').value.trim();
  const clazz = document.getElementById('addClass').value.trim();
  const world = document.getElementById('addWorld').value.trim();
  const sprite = document.getElementById('addSprite').value.trim();
  const type = document.getElementById('addType').value;

  if (!ign) return showToast('IGN es requerido', 'error');

  const raw = localStorage.getItem('characters');
  const characters = raw ? JSON.parse(raw) : {};

  if (characters[ign]) return showToast('Ese IGN ya existe. Usa otro.', 'error');

  characters[ign] = {
    name: ign,
    class: clazz || 'Unknown',
    world: world || 'Unknown',
    sprite: sprite || 'assets/manualentry.png',
    type: type || 'main'
  };

  localStorage.setItem('characters', JSON.stringify(characters));
  localStorage.setItem('currentCharacter', ign);

  showToast('Character creado ✅', 'success');

  // Actualiza el dropdown sin recargar
  renderCustomDropdown(characters, ign);

  closeAddCharacterModal();
});
// 🔹 Helper para mapear el tipo seleccionado a los valores internos
function toCanon(value) {
  const map = {
    main: 'main',
    bossing: 'second',
    mule: 'mule',
    hyperburn: 'champion'
  };
  return map[value] || value;
}

// Guardar nuevo character
document.getElementById('addCharForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const ign = document.getElementById('addIgn').value.trim();
  const clazz = document.getElementById('addClass').value.trim();
  const world = document.getElementById('addWorld').value.trim();
  const sprite = document.getElementById('addSprite').value.trim();
  const rawType = document.getElementById('addType').value;
  const type = toCanon(rawType); // 🔹 Mapeo al formato del dropdown

  if (!ign) return showToast('IGN es requerido', 'error');

  const raw = localStorage.getItem('characters');
  const characters = raw ? JSON.parse(raw) : {};

  if (characters[ign]) return showToast('Ese IGN ya existe. Usa otro.', 'error');

  characters[ign] = {
    name: ign,
    class: clazz || 'Unknown',
    world: world || 'Unknown',
    sprite: sprite || 'assets/manualentry.png',
    type: type || 'main'
  };

  localStorage.setItem('characters', JSON.stringify(characters));
  localStorage.setItem('currentCharacter', ign);

  showToast('Character creado ✅', 'success');

  // Actualiza el dropdown sin recargar
  renderCustomDropdown(characters, ign);

  closeAddCharacterModal();
});

// Toast helper (usa Toastify si está)
function showToast(msg, type = 'info') {
  if (window.Toastify) {
    Toastify({
      text: msg,
      duration: 2200,
      gravity: 'top',
      position: 'right',
      backgroundColor: type === 'error' ? '#dc2626' :
        type === 'success' ? '#16a34a' : '#334155'
    }).showToast();
  } else {
    alert(msg);
  }
}


// --- Tabs Auto/Manual ---
const tabAutoBtn = document.getElementById('tabAuto');
const tabManualBtn = document.getElementById('tabManual');
const autoSection = document.getElementById('autoSection');

function setTab(which) {
  const active = 'bg-gray-900';
  tabAutoBtn.classList.toggle(active, which === 'auto');
  tabManualBtn.classList.toggle(active, which === 'manual');
  autoSection.classList.toggle('hidden', which !== 'auto');
}
// default: Auto
setTab('auto');
tabAutoBtn.onclick = () => setTab('auto');
tabManualBtn.onclick = () => setTab('manual');

// --- Fetch MapleRanks ---
document.getElementById('fetchMR').addEventListener('click', async () => {
  const ign = document.getElementById('addIgn').value.trim();
  if (!ign) return showToast('Escribe un IGN primero', 'error');

  try {
    toggleFetchLoading(true);

    // 👇 Usamos la función que ya tienes
    const data = await fetchMapleranksData(ign);

    // Rellenar campos del modal
    document.getElementById('addClass').value = data.class || '';
    document.getElementById('addWorld').value = data.world || '';
    document.getElementById('addSprite').value = data.sprite || '';

    // Mostrar preview
    document.getElementById('previewSprite').src = data.sprite || 'assets/manualentry.png';
    document.getElementById('previewClass').textContent = data.class || '—';
    document.getElementById('previewWorld').textContent = data.world || '—';
    document.getElementById('previewRow').classList.remove('hidden');

    showToast('Datos cargados desde MapleRanks ✅', 'success');

  } catch (err) {
    console.error(err);
    showToast(err.message || 'No se pudo obtener el personaje', 'error');
  } finally {
    toggleFetchLoading(false);
  }
});

function toggleFetchLoading(isLoading) {
  const btn = document.getElementById('fetchMR');
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Fetching...' : 'Fetch';
}

// ⚙️ Implementación del fetch (elige A o B)
async function fetchMapleRanks(ign) {
  // ====== Opción A: tu backend (recomendado) ======
  // const res = await fetch(`/api/mapleranks?ign=${encodeURIComponent(ign)}`);
  // if (!res.ok) throw new Error('IGN no encontrado');
  // return await res.json(); // -> { class, world, sprite }

  // ====== Opción B: scraping (riesgoso, sujeto a cambios; puede requerir CORS proxy) ======
  const url = `https://mapleranks.com/u/${encodeURIComponent(ign)}`;
  const html = await (await fetch(url, { mode: 'cors' })).text();

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // *** OJO: Selectores pueden cambiar. Ajusta según estructura real. ***
  // Busca clase y mundo en algún bloque conocido:
  const classEl = doc.querySelector('.profile-character .class, .char-class, .character-job');
  const worldEl = doc.querySelector('.profile-character .world, .char-world, .character-world');

  // Sprite: intenta con imagen de avatar
  const spriteEl = doc.querySelector('.profile-character img, .avatar img, img.character, img[src*="avatar"]');

  const mapped = {
    class: classEl?.textContent?.trim() || '',
    world: worldEl?.textContent?.trim() || '',
    sprite: spriteEl?.src || ''
  };

  if (!mapped.class && !mapped.world && !mapped.sprite) {
    throw new Error('No se pudo parsear MapleRanks (estructura cambió)');
  }
  return mapped;
}

// --- Abrir/Cerrar modal (igual que antes) ---
function openAddCharacterModal() {
  const m = document.getElementById('addCharModal');
  m.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('addIgn')?.focus(), 0);
}
function closeAddCharacterModal() {
  const m = document.getElementById('addCharModal');
  m.classList.add('hidden');
  document.body.style.overflow = '';
  // limpia
  document.getElementById('addCharForm').reset();
  document.getElementById('previewRow').classList.add('hidden');
}

(function wireAddModalClose() {
  const modal = document.getElementById('addCharModal');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAddCharacterModal(); });
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('hidden') && e.key === 'Escape') closeAddCharacterModal();
  });
})();

// --- Guardar ---
document.getElementById('addCharForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const ign = document.getElementById('addIgn').value.trim();
  const clazz = document.getElementById('addClass').value.trim();
  const world = document.getElementById('addWorld').value.trim();
  const sprite = document.getElementById('addSprite').value.trim();
  const type = document.getElementById('addType').value;

  if (!ign) return showToast('IGN es requerido', 'error');

  const raw = localStorage.getItem('characters');
  const characters = raw ? JSON.parse(raw) : {};

  if (characters[ign]) return showToast('Ese IGN ya existe. Usa otro.', 'error');

  characters[ign] = {
    name: ign,
    class: clazz || 'Unknown',
    world: world || 'Unknown',
    sprite: sprite || 'assets/manualentry.png',
    type: type || 'main',
    // si quieres guardar parámetros de avatar (zoom/offset) por personaje:
    // avatar: { scale: 2.1, offsetY: -10 }
  };

  localStorage.setItem('characters', JSON.stringify(characters));
  localStorage.setItem('currentCharacter', ign);

  showToast('Character creado ✅', 'success');

  // Rerender dropdown
  renderCustomDropdown(characters, ign);

  // Si también quieres refrescar header:
  // renderCharacterHeader({ name: ign, class: clazz, world, spriteUrl: sprite });

  closeAddCharacterModal();
});

// Toast helper
function showToast(msg, type = 'info') {
  if (window.Toastify) {
    Toastify({
      text: msg,
      duration: 2200,
      gravity: 'top',
      position: 'right',
      backgroundColor: type === 'error' ? '#dc2626' :
        type === 'success' ? '#16a34a' : '#334155'
    }).showToast();
  } else {
    alert(msg);
  }
}

const CANON_MAP = {
  'second': 'second main',
  'mule': 'ctene mule',
  'champion': 'champion mule',
  'second main': 'second main',
  'ctene mule': 'ctene mule',
  'champion mule': 'champion mule',
  'main': 'main',
};
function toCanon(v) {
  return CANON_MAP[String(v || '').trim().toLowerCase()] || '';
}

function calcFragsSpent(ign) {
  const characters = JSON.parse(localStorage.getItem("characters")) || {};
  if (!characters[ign]) return;

  const char = characters[ign];
  const classData = skillsData[char.class];
  if (!classData) return;

  let totalFragsSpent = 0;

  // 🔹 todas las skills de la clase
  const allSkills = [
    ...(classData.originSkill ? [classData.originSkill] : []),
    ...(classData.ascentSkill ? [classData.ascentSkill] : []),
    ...(classData.firstMastery || []),
    ...(classData.secondMastery || []),
    ...(classData.thirdMastery || []),
    ...(classData.fourthMastery || []),
    ...(classData.boostSkills || []),
    ...(classData.commonSkills || []),
  ];

  const uniqueSkills = [...new Set(allSkills.filter(Boolean))];

  uniqueSkills.forEach((skillName) => {
    const currentLevel = char.skills?.[skillName] || 0;
    const skillType = detectSkillType(skillName, classData);
    const costTable = costsData[skillType].levels;

    // 🔹 sumar frags gastados desde Lv1 hasta Current Lv
    for (let lvl = 1; lvl <= currentLevel; lvl++) {
      if (costTable[lvl]) {
        totalFragsSpent += costTable[lvl].frags;
      }
    }
  });

  // Mostrar el total en el span
  document.getElementById("totalFragments").textContent = totalFragsSpent;
}
document.getElementById("recalcFragmentsBtn").addEventListener("click", () => {
  const ign = localStorage.getItem("currentCharacter");
  calcFragsSpent(ign);
});
