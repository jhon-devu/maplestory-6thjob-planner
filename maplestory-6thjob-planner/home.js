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
