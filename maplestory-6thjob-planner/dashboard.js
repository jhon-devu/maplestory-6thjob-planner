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
      alert('No character selected. Please add a character first.');
      window.location.href = 'index.html';
      return;
    }
  }


  // Mostrar encabezado con datos del personaje
  document.getElementById('charName').textContent = ign;
  document.getElementById('charClass').textContent = char.class;
  document.getElementById('charLevel').textContent = char.level || '?';
  document.getElementById('charProgress').textContent = char.progress || '?';
  document.getElementById('charWorld').textContent = char.world || '?';
  document.getElementById('charSprite').src = char.sprite || '';

  // Cargar habilidades
  const res = await fetch('data/skills.json');
  const data = await res.json();
  const skills = data[char.class];

  if (!skills) {
    alert(`Class "${char.class}" not found in skills.json`);
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

function populateCharacterDropdown() {
  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  const current = localStorage.getItem('currentCharacter');
  const select = document.getElementById('characterSelect');

  select.innerHTML = ''; // limpiar antes

  Object.keys(characters).forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    if (name === current) option.selected = true;
    select.appendChild(option);
  });

  select.onchange = () => {
    localStorage.setItem('currentCharacter', select.value);
    loadSkills();
  };
}

function deleteCurrentCharacter() {
  const ign = localStorage.getItem('currentCharacter');
  const confirmDelete = confirm(`Are you sure you want to delete ${ign}?`);

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

  window.location.href = 'index.html'; // volver al inicio
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
renderCustomDropdown(characters, current);
function renderCustomDropdown(characters, currentIgn) {
  const dropdownButton = document.getElementById('dropdownButton');
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownList = document.getElementById('dropdownList');

  dropdownSelected.textContent = currentIgn || 'Select Character';
  dropdownList.innerHTML = '';

  Object.keys(characters).forEach((ign) => {
    const char = characters[ign];
    const option = document.createElement('div');
    option.className = 'flex items-center gap-2 px-4 py-2 hover:bg-gray-700 cursor-pointer';

    const img = document.createElement('img');
    img.src = char.sprite || '';
    img.className = 'w-6 h-6 rounded';

    const name = document.createElement('span');
    name.textContent = ign;

    option.appendChild(img);
    option.appendChild(name);

    option.addEventListener('click', () => {
      localStorage.setItem('currentCharacter', ign);
      location.reload();
    });

    dropdownList.appendChild(option);
  });

  dropdownButton.addEventListener('click', () => {
    dropdownList.classList.toggle('hidden');
  });

  // Cierra si haces clic fuera del botón
  window.addEventListener('click', (e) => {
    if (!dropdownButton.contains(e.target)) {
      dropdownList.classList.add('hidden');
    }
  });
}


populateCharacterDropdown(); // llamar al cargar la página
