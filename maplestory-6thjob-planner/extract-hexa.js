import fs from "fs";
import path from "path";
import axios from "axios";

// Cost tables (sacadas del bundle)
const COST_TABLES = {
  Origin: "X",
  Ascendant: "X",
  Mastery: "k",
  Enhancement: "f",
  Common: "y",
};

// ⚡ Ejemplo reducido, deberías pegar aquí el objeto gigante que viste en el bundle
const CLASSES = {
  Hero: {
    originSkill: "Spirit Calibur",
    ascentSkill: "Silent Cleave",
    masterySkills: ["HEXA Raging Blow", "HEXA Rising Rage"],
    boostSkills: ["Burning Soul Blade Boost"],
    commonSkills: ["Sol Janus"],
  },
  "Dark Knight": {
    originSkill: "Dead Space",
    ascentSkill: "Dark Halidom",
    masterySkills: ["HEXA Gungnir's Descent"],
    boostSkills: ["Spear of Darkness Boost"],
    commonSkills: ["Sol Janus"],
  },
  // ... 🔥 copia todo el objeto desde el bundle
};

// Normaliza para URLs (quita espacios, comillas, etc.)
function normalizeName(str) {
  return str.replace(/[:']/g, "").replace(/\s+/g, "_");
}

// Construye URL de imagen
function getImageUrl(className, skillName, isCommon = false) {
  if (isCommon) {
    return `https://masonym.dev/common/${normalizeName(skillName)}.png`;
  }
  return `https://masonym.dev/classImages/${normalizeName(className)}/Skill_${normalizeName(skillName)}.png`;
}

// Convierte cada clase a JSON
function buildJson() {
  let out = {};

  for (const [className, data] of Object.entries(CLASSES)) {
    out[className] = { skills: [] };

    // Origin
    if (data.originSkill) {
      out[className].skills.push({
        name: data.originSkill,
        type: "Origin",
        maxLevel: 30,
        costTable: COST_TABLES["Origin"],
        image: getImageUrl(className, data.originSkill),
      });
    }

    // Ascent
    if (data.ascentSkill) {
      out[className].skills.push({
        name: data.ascentSkill,
        type: "Ascendant",
        maxLevel: 30,
        costTable: COST_TABLES["Ascendant"],
        image: getImageUrl(className, data.ascentSkill),
      });
    }

    // Mastery
    data.masterySkills?.forEach((s) =>
      out[className].skills.push({
        name: s,
        type: "Mastery",
        maxLevel: 30,
        costTable: COST_TABLES["Mastery"],
        image: getImageUrl(className, s),
      })
    );

    // Boost
    data.boostSkills?.forEach((s) =>
      out[className].skills.push({
        name: s,
        type: "Enhancement",
        maxLevel: 30,
        costTable: COST_TABLES["Enhancement"],
        image: getImageUrl(className, s),
      })
    );

    // Common
    data.commonSkills?.forEach((s) =>
      out[className].skills.push({
        name: s,
        type: "Common",
        maxLevel: 30,
        costTable: COST_TABLES["Common"],
        image: getImageUrl(className, s, true),
      })
    );
  }

  return out;
}

// Descarga imágenes y las guarda en ./assets
async function downloadImages(json) {
  for (const [className, data] of Object.entries(json)) {
    for (const skill of data.skills) {
      const folder = path.join("assets", "skills", normalizeName(className));
      const file = path.join(folder, `Skill_${normalizeName(skill.name)}.png`);

      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      try {
        const res = await axios.get(skill.image, { responseType: "arraybuffer" });
        fs.writeFileSync(file, res.data);
        console.log(`✅ Saved ${file}`);
      } catch (err) {
        console.warn(`⚠️ Could not fetch ${skill.image}`);
      }
    }
  }
}

async function main() {
  const json = buildJson();

  // Guardar JSON
  fs.writeFileSync("hexa-skills.json", JSON.stringify(json, null, 2));
  console.log("📂 hexa-skills.json generated");

  // Bajar imágenes
  await downloadImages(json);
}

main();
