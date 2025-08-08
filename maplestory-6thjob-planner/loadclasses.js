
  async function loadClassOptions() {
    try {
      const res = await fetch('data/skills.json');
      const data = await res.json();
      const classSelect = document.getElementById('manualClass');

      Object.keys(data).sort().forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading class options:', error);
    }
  }

  // Llama la función al cargar
  window.addEventListener('DOMContentLoaded', loadClassOptions);
