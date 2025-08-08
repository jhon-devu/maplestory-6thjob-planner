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

  // Cargar habilidades
  const res = await fetch('data/skills.json');
  const data = await res.json();
  const classData = data[char.class];
  const skills = classData?.skills;

  if (!skills) {
    Toastify({
      text: `❌ Class "${char.class}" not found in skills.json`,
      duration: 4000,
      gravity: "top",
      position: "right",
      backgroundColor: "#DC2626", // rojo
    }).showToast();
    return;
  }

  const tbody = document.getElementById('skillsTable');
  tbody.innerHTML = '';

  skills.forEach((skill) => {
    const currentLevel = char.skills?.[skill.name] || 0;
    const remainingLevels = skill.maxLevel - currentLevel;
    const fragCost = remainingLevels * skill.fragmentCostPerLevel;
    const energyCost = remainingLevels * skill.energyCostPerLevel;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-2">${skill.name}</td>
      <td class="px-4 py-2">
        <input type="number" min="0" max="${skill.maxLevel}" value="${currentLevel}" 
               onchange="updateSkillLevel('${ign}', '${skill.name}', this.value)" 
               class="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white">
      </td>
      <td class="px-4 py-2">${skill.maxLevel}</td>
      <td class="px-4 py-2">${fragCost}</td>
      <td class="px-4 py-2">${energyCost}</td>
    `;
    tbody.appendChild(row);
  });
}

function updateSkillLevel(ign, skillName, level) {
  const levelNum = parseInt(level);
  if (isNaN(levelNum)) return;

  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  if (!characters[ign]) return;

  characters[ign].skills = characters[ign].skills || {};
  characters[ign].skills[skillName] = levelNum;
  localStorage.setItem('characters', JSON.stringify(characters));
  loadSkills();
}


loadSkills();


async function deleteCurrentCharacter() {
  const ign = localStorage.getItem('currentCharacter');
  const confirmDelete = await showConfirm(`Are you sure you want to delete ${ign}?`);

  if (!confirmDelete) return;

  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  delete characters[ign];

  localStorage.setItem('characters', JSON.stringify(characters));

  const remaining = Object.keys(characters);
  if (remaining.length > 0) {
    localStorage.setItem('currentCharacter', remaining[0]);
  } else {
    localStorage.removeItem('currentCharacter');
  }

  window.location.href = 'index.html';
}

function goToAddCharacter() {
  window.location.href = 'index.html';
}

function updateCharacterPreview(data) {
  document.getElementById('previewSprite').src = data.sprite || '';
  document.getElementById('previewName').textContent = data.name || 'IGN';
  document.getElementById('previewClass').textContent = `${data.class || 'Class'} – ${data.world || 'World'}`;
}

const characters = JSON.parse(localStorage.getItem('characters')) || {};
const current = localStorage.getItem('currentCharacter');
const type = char.type || '';
document.getElementById('charType').textContent = getTypeLabel(type);

function renderCustomDropdown(characters, currentIgn) {
  const dropdownButton = document.getElementById('dropdownButton');
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownList = document.getElementById('dropdownList');

  dropdownSelected.textContent = currentIgn || 'Select Character';
  dropdownList.innerHTML = '';

  Object.keys(characters).forEach((ign) => {
    const char = characters[ign];

    const option = document.createElement('div');
    option.className = 'flex items-center justify-between gap-2 px-4 py-2 hover:bg-gray-700';

    // 📌 Info: sprite + nombre
    const info = document.createElement('div');
    info.className = 'flex items-center gap-2 cursor-pointer';

    const img = document.createElement('img');
    img.src = char.sprite || 'assets/manualentry.png';
    img.className = 'w-6 h-6 rounded';

    const name = document.createElement('span');
    name.textContent = ign;

    info.appendChild(img);
    info.appendChild(name);

    info.addEventListener('click', () => {
      localStorage.setItem('currentCharacter', ign);
      location.reload();
    });

    // 🎨 Selector de tipo (Main / Second / Ctene / Champion)
    const typeSelect = document.createElement('select');
    typeSelect.className = 'text-sm px-2 py-1 rounded focus:outline-none';
    const options = [
      { label: 'Main', value: 'main', color: 'bg-green-200 text-green-900' },
      { label: 'Second Main', value: 'second', color: 'bg-blue-200 text-blue-900' },
      { label: 'Ctene Mule', value: 'ctene', color: 'bg-purple-200 text-purple-900' },
      { label: 'Champion Mule', value: 'champion', color: 'bg-yellow-200 text-yellow-900' },
    ];

    options.forEach(opt => {
      const optEl = document.createElement('option');
      optEl.value = opt.value;
      optEl.textContent = opt.label;
      typeSelect.appendChild(optEl);
    });

    // Establecer color y valor inicial
    typeSelect.value = char.type || '';
    applyTypeStyle(typeSelect, typeSelect.value);

    typeSelect.addEventListener('change', () => {
      const selected = typeSelect.value;
      applyTypeStyle(typeSelect, selected);
      characters[ign].type = selected;
      localStorage.setItem('characters', JSON.stringify(characters));
    });

    // ❌ Botón eliminar
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.className = 'text-red-500 hover:text-red-700 font-bold';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmDelete = await showConfirm(`Are you sure you want to delete ${ign}?`);
      if (!confirmDelete) return;

      delete characters[ign];
      localStorage.setItem('characters', JSON.stringify(characters));

      if (localStorage.getItem('currentCharacter') === ign) {
        const keys = Object.keys(characters);
        if (keys.length > 0) {
          localStorage.setItem('currentCharacter', keys[0]);
        } else {
          localStorage.removeItem('currentCharacter');
        }
        location.reload();
      } else {
        renderCustomDropdown(characters, localStorage.getItem('currentCharacter'));
      }

      Toastify({
        text: `Character "${ign}" deleted`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#ef4444",
      }).showToast();
    });

    // Ensamblar fila
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 justify-between w-full';
    row.appendChild(info);
    row.appendChild(typeSelect);
    row.appendChild(deleteBtn);

    option.appendChild(row);
    dropdownList.appendChild(option);
  });

  dropdownButton.addEventListener('click', () => {
    dropdownList.classList.toggle('hidden');
  });

  window.addEventListener('click', (e) => {
    if (!dropdownButton.contains(e.target)) {
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

  // Opcional: recargar para aplicar estilos de color si lo usas
  loadSkills?.();
}
