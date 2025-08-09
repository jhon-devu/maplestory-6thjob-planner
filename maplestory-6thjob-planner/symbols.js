(() => {
    const SYMBOLS = [
        // Arcane
        { key: 'arcane_vj', name: 'Vanishing Journey', type: 'arcane', icon: 'assets/arcane_vj.webp' },
        { key: 'arcane_cc', name: 'Chu Chu Island', type: 'arcane', icon: 'assets/arcane_cc.webp' },
        { key: 'arcane_ll', name: 'Lachelein', type: 'arcane', icon: 'assets/arcane_ll.webp' },
        { key: 'arcane_ar', name: 'Arcana', type: 'arcane', icon: 'assets/arcane_ar.webp' },
        { key: 'arcane_ms', name: 'Morass', type: 'arcane', icon: 'assets/arcane_ms.webp' },
        { key: 'arcane_es', name: 'Esfera', type: 'arcane', icon: 'assets/arcane_es.webp' },
        // Sacred
        { key: 'sacred_ce', name: 'Cernium', type: 'sacred', icon: 'assets/sacred_ce.webp' },
        { key: 'sacred_ha', name: 'Hotel Arcus', type: 'sacred', icon: 'assets/sacred_ha.webp' },
        { key: 'sacred_od', name: 'Odium', type: 'sacred', icon: 'assets/sacred_od.webp' },
        { key: 'sacred_sh', name: 'Shangri-La', type: 'sacred', icon: 'assets/sacred_sh.webp' },
        { key: 'sacred_ar', name: 'Arteria', type: 'sacred', icon: 'assets/sacred_ar.webp' },
        { key: 'sacred_ca', name: 'Carcion', type: 'sacred', icon: 'assets/sacred_ca.webp' },
    ];

    const STORAGE_KEY = 'symbolsProgress';
    const defaultsByType = {
        arcane: { currentLevel: 1, maxLevel: 20, daysPerLevel: 3 },
        sacred: { currentLevel: 1, maxLevel: 11, daysPerLevel: 5 },
    };

    const $ = (id) => document.getElementById(id);

    function loadState() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
        catch { return {}; }
    }
    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    function getDefaults(type) {
        return defaultsByType[type] || { currentLevel: 1, maxLevel: 20, daysPerLevel: 3 };
    }
    function calcDaysLeft(cur, max, dpl) {
        const rem = Math.max(0, (max || 20) - (cur || 1));
        return rem * Math.max(1, dpl || 3);
    }

    function renderSymbols(type, containerId) {
        const grid = $(containerId);
        if (!grid) return;
        const state = loadState();
        grid.innerHTML = SYMBOLS.filter(s => s.type === type).map(sym => {
            const def = getDefaults(sym.type);
            const data = { ...def, ...(state[sym.key] || {}) };
            const daysLeft = calcDaysLeft(data.currentLevel, data.maxLevel, data.daysPerLevel);

            return `
        <div class="bg-gray-800/60 border border-gray-700 rounded-lg p-1.5 flex flex-col items-center text-center">
          <img src="${sym.icon}" alt="${sym.name}" class="w-8 h-8 object-contain mb-0.5"
               onerror="this.src='https://placehold.co/32x32?text=%F0%9F%97%91%EF%B8%8F'">
          <div class="text-[10px] font-medium text-gray-100 truncate w-full">${sym.name}</div>
          <input value="${daysLeft}" class="mt-0.5 w-full bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-[10px] text-gray-100 text-center" readonly>
          <button class="mt-0.5 px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-[9px] text-gray-100"
                  onclick="openSymbolModal('${sym.key}')">
            Edit
          </button>
        </div>
      `;
        }).join('');
    }

    // Modal global para onclick
    window.openSymbolModal = function (symbolKey) {
        const sym = SYMBOLS.find(s => s.key === symbolKey);
        const state = loadState();
        const def = getDefaults(sym.type);
        const data = { ...def, ...(state[symbolKey] || {}) };

        $('modalTitle').textContent = `Edit: ${sym.name}`;
        $('modalCurrentLevel').value = data.currentLevel;
        $('modalMaxLevel').value = data.maxLevel;
        $('modalDaysPerLevel').value = data.daysPerLevel;

        $('symbolModal').classList.remove('hidden');
        $('symbolModal').classList.add('flex');
        window.CURRENT_EDIT_KEY = symbolKey;
    };

    function closeModal() {
        $('symbolModal').classList.add('hidden');
        $('symbolModal').classList.remove('flex');
        window.CURRENT_EDIT_KEY = null;
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderSymbols('arcane', 'arcaneGrid');
        renderSymbols('sacred', 'sacredGrid');

        $('btnCancelModal')?.addEventListener('click', closeModal);
        $('btnSaveModal')?.addEventListener('click', () => {
            if (!window.CURRENT_EDIT_KEY) return;
            const cur = parseInt($('modalCurrentLevel').value || '1', 10);
            const max = parseInt($('modalMaxLevel').value || '20', 10);
            const dpl = parseInt($('modalDaysPerLevel').value || '3', 10);

            const state = loadState();
            state[window.CURRENT_EDIT_KEY] = { currentLevel: cur, maxLevel: max, daysPerLevel: dpl };
            saveState(state);

            closeModal();
            renderSymbols('arcane', 'arcaneGrid');
            renderSymbols('sacred', 'sacredGrid');
        });
    });
})();
