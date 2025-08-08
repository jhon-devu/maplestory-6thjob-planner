function saveCharacterData(ign, data) {
  const characters = JSON.parse(localStorage.getItem('characters')) || {};

  characters[ign] = {
    class: data.class,
    world: data.world,
    level: data.level,
    progress: data.progress,
    sprite: data.sprite,
    skills: {} // Se llenará después con la interacción del usuario
  };

  localStorage.setItem('characters', JSON.stringify(characters));
  localStorage.setItem('currentCharacter', ign);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedOptions = document.getElementById('savedOptions');
  const characters = localStorage.getItem('characters');
  if (characters) {
    savedOptions.classList.remove('hidden');
  }
});

// Continuar con datos guardados
function continueWithSavedData() {
  const characters = JSON.parse(localStorage.getItem('characters')) || {};
  const currentCharacter = localStorage.getItem('currentCharacter');

  if (characters[currentCharacter]) {
    window.location.href = 'dashboard.html';
  } else {
    alert('No saved character data found.');
  }
}

// Limpiar datos guardados
function clearSavedData() {
  if (confirm('Are you sure you want to clear all saved data?')) {
    localStorage.removeItem('characters');
    localStorage.removeItem('currentCharacter');
    localStorage.removeItem('ms_tracker_ign');
    localStorage.removeItem('ms_tracker_source');
    location.reload(); // recargar para ocultar botones
  }
}
