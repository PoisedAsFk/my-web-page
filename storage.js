export function getStoredKills() {
    return JSON.parse(localStorage.getItem("npcKills")) || {};
}

export function loadLocalStorageKills(onSaveCallback) {
    const npcInputs = document.querySelectorAll("input[data-npc-name]");
    const npcKills = getStoredKills();

    npcInputs.forEach((input) => {
        const npcName = input.dataset.npcName;
        const npcKillsValue = npcKills[npcName] || 0;

        input.value = npcKillsValue;
    });

    saveLocalStorageKills(onSaveCallback);
}

export function saveLocalStorageKills(onSaveCallback) {
    const npcInputs = document.querySelectorAll("#settingsTabContent input[data-npc-name]");

    // Sync inputs between tabs if necessary
    // Note: This relies on the DOM structure. 
    // Ideally this would be decoupled, but for now we keep the logic here.
    const calculateTabContent = document.getElementById("calculateTabContent");
    const filteredNpcInputs = document.querySelectorAll("#calculateTabContent input[data-npc-name]");

    if (filteredNpcInputs.length > 0 && calculateTabContent && calculateTabContent.classList.contains("active")) {
        filteredNpcInputs.forEach((input) => {
            if (input.value !== "") {
                const npcName = input.dataset.npcName;
                const npcKillsValue = input.value;
                const npcInput = document.querySelector(`#settingsTabContent input[data-npc-name="${npcName}"]`);
                if (npcInput) npcInput.value = npcKillsValue;
            }
        });
    }

    const npcKills = {};

    npcInputs.forEach((input) => {
        const npcName = input.dataset.npcName;
        const npcKillsValue = input.value;

        npcKills[npcName] = npcKillsValue;
    });

    localStorage.setItem("npcKills", JSON.stringify(npcKills));

    if (onSaveCallback && typeof onSaveCallback === 'function') {
        onSaveCallback();
    }
}
