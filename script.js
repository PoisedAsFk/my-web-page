import { prettifyString } from "./helpers.js";

const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const tab1Content = document.getElementById("tab1");
const settingsTabContent = document.getElementById("settingsTabContent");

fetch("data/npcdata.json")
	.then((response) => response.json())
	.then((npcs) => {
		createSettingsUI(npcs);
	})
	.catch((error) => console.error("Error fetching NPCs:", error));

calculateTab.addEventListener("click", () => {
	tab1Content.classList.add("active");
	settingsTabContent.classList.remove("active");
	calculateTab.classList.add("active");
	settingsTab.classList.remove("active");
});

settingsTab.addEventListener("click", () => {
	settingsTabContent.classList.add("active");
	tab1Content.classList.remove("active");
	settingsTab.classList.add("active");
	calculateTab.classList.remove("active");
});

function createSettingsUI(npcs) {
	const npcLocations = [...new Set(npcs.map((npc) => npc.NpcArea))];

	npcLocations.forEach((npcLocation) => {
		const npcLocationDiv = document.createElement("div");
		npcLocationDiv.classList.add("npc-area-panel");
		npcLocationDiv.id = npcLocation;

		const npcLocationHeader = document.createElement("h2");
		npcLocationHeader.textContent = prettifyString(npcLocation);

		const npcLocationContentList = document.createElement("ul");
		npcLocationContentList.classList.add("npc-content-list");

		npcLocationDiv.appendChild(npcLocationHeader);
		npcLocationDiv.appendChild(npcLocationContentList);
		settingsTabContent.appendChild(npcLocationDiv);

		const filteredNpcs = npcs.filter((npc) => npc.NpcArea === npcLocation);

		filteredNpcs.forEach((npc) => {
			const npcListItem = document.createElement("li");
			npcListItem.textContent = `${prettifyString(npc.Name)}: `;

			const npcInput = document.createElement("input");
			npcInput.type = "number";
			npcInput.dataset.npcName = npc.Name;

			npcInput.addEventListener("change", saveLocalStorageKills);

			npcListItem.appendChild(npcInput);
			npcLocationContentList.appendChild(npcListItem);
		});
	});

	loadLocalStorageKills();
}

//Loads the kills from local storage, if none set each input to 0 and save it to local storage
function loadLocalStorageKills() {
	const npcInputs = document.querySelectorAll("input[data-npc-name]");
	const npcKills = JSON.parse(localStorage.getItem("npcKills")) || {};

	npcInputs.forEach((input) => {
		const npcName = input.dataset.npcName;
		const npcKillsValue = npcKills[npcName] || 0;

		input.value = npcKillsValue;
	});

	saveLocalStorageKills();
}

//Saves the kills to local storage
function saveLocalStorageKills() {
	const npcInputs = document.querySelectorAll("input[data-npc-name]");
	const npcKills = {};

	npcInputs.forEach((input) => {
		const npcName = input.dataset.npcName;
		const npcKillsValue = input.value;

		npcKills[npcName] = npcKillsValue;
	});

	localStorage.setItem("npcKills", JSON.stringify(npcKills));
}
