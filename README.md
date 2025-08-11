MapleStory – 6th Job Planner
A small HTML/CSS/JS toolkit for planning and tracking progress in MapleStory’s 6th Job (Hexa) system and Arcane/Sacred Symbols. Designed for quick use in the browser with no backend dependencies.

What’s done so far
Character Management

Add, edit, and delete characters.

Persistent storage via localStorage (keeps data between sessions).

Character selector dropdown with click-outside, focus, and close behavior.

Header displaying IGN / Class / Level / World.

6th Job (Hexa) Planner

JSON data structure for each class (e.g., Wind Archer) including:

maxLevel, fragmentCostPerLevel, energyCostPerLevel.

Automatic calculation of total fragment and energy costs per skill and overall.

Modular hexa-costs.js with safe async loading.

Toastify notifications for status and errors.

Arcane & Sacred Symbol Progress

Progress tracking by area (Arcana, Morass, Esfera, Cernium, etc.).

Input current level and remaining symbols → output:

Mesos needed, days required (with dailies).

Estimated completion date.

Optional weeklies (+120/week) toggle for faster calculations.

UX and Stability Improvements

Fixed broken asset paths for icons and images.

Resolved common JS errors:

await usage outside async functions.

import statements outside modules → fixed with type="module".

MIME type and 404 issues when serving files.

Illegal return statement and dashboard load flow.

Friendly error messages and redirects.

Stack & Decisions
Vanilla JS + HTML + Tailwind CSS 

Toastify for lightweight notifications.

localStorage for simple and portable state management.

Class/skill data stored in version-controlled JSON.

Project Structure (simplified)
bash
Copiar
/assets/           # icons, symbol images
/index.html        # character list & entry page
/dashboard.html    # main view (stats, skills, symbols)
/app.js            # app bootstrap
/home.js           # landing & selection logic
/dashboard.js      # dashboard UI and events
/dashboard.stats.js# stats helpers
/hexa-costs.js     # Hexa cost calculations
/data/*.json       # skill definitions per class

Serve the directory with a static server (e.g., VS Code Live Server).

Open index.html in your browser.

If using ES6 imports, make sure you run over HTTP (not file://).

Roadmap
Add visual progress charts for Hexa and Symbols.

Export/Import progress as JSON for sharing builds.

More validation and quick UI testing.

Fine-tune weekly calculations and mixed daily/weekly scenarios.

Status: Fully functional for basic Hexa & Symbol planning with character management; ongoing work on visual improvements and advanced tracking.
