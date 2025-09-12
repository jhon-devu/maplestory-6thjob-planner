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
