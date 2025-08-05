async function loadSkills() {
  const ign = localStorage.getItem('ms_tracker_ign') || 'Unknown';
  const className = localStorage.getItem('ms_tracker_class') || 'Adele';
  document.getElementById('charName').textContent = ign;
  document.getElementById('charClass').textContent = className;

  const res = await fetch('data/skills.json');
  const data = await res.json();

const skills = data[className];

if (!skills) {
  alert(`Class "${className}" not found in skills.json`);
  return;
}

const tbody = document.getElementById('skillsTable');
tbody.innerHTML = '';

skills.forEach((skill, index) => {
  const currentLevel = loadSkillLevel(ign, skill.name);
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

function loadSkillLevel(ign, skillName) {
  const key = `skill_${ign}_${skillName}`;
  return parseInt(localStorage.getItem(key)) || 0;
}

function updateSkillLevel(ign, skillName, level) {
  const key = `skill_${ign}_${skillName}`;
  localStorage.setItem(key, level);
  loadSkills(); // refresh the table with updated costs
}

loadSkills();
// Mostrar sprite y otros datos adicionales
document.getElementById('charSprite').src = localStorage.getItem('ms_tracker_sprite') || '';
document.getElementById('charLevel').textContent = localStorage.getItem('ms_tracker_level') || '?';
document.getElementById('charProgress').textContent = localStorage.getItem('ms_tracker_progress') || '?';
document.getElementById('charWorld').textContent = localStorage.getItem('ms_tracker_world') || '?';
