import { prettifyString } from "./helpers.js";

const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const calculateTabContent = document.getElementById("calculateTabContent");
const settingsTabContent = document.getElementById("settingsTabContent");
const lootItemDatalist = document.getElementById("loot-item-options");
const filteredNpcsPanel = document.querySelector(".filtered-npc-panel");

let npcsArray = [];
let itemsArray = [];

fetch("data/npcdata.json")
	.then((response) => response.json())
	.then((npcs) => {
		npcsArray = npcs;
		createSettingsUI(npcs);
	})
	.catch((error) => console.error("Error fetching NPCs:", error));

fetch("data/itemdata.json")
	.then((response) => response.json())
	.then((items) => {
		itemsArray = items;
		const dropdownList = document.querySelector(".dropdown-list");
		items.forEach((item) => {
			const li = document.createElement("li");
			li.textContent = prettifyString(item.Name);
			li.dataset.itemId = item.ItemId;
			dropdownList.appendChild(li);
		});
		initDropdownEvents();
	})
	.catch((error) => console.error("Error fetching items:", error));

calculateTab.addEventListener("click", () => {
	calculateTabContent.classList.add("active");
	settingsTabContent.classList.remove("active");
	calculateTab.classList.add("active");
	settingsTab.classList.remove("active");
	loadLocalStorageKills();
});

settingsTab.addEventListener("click", () => {
	settingsTabContent.classList.add("active");
	calculateTabContent.classList.remove("active");
	settingsTab.classList.add("active");
	calculateTab.classList.remove("active");
});

function initDropdownEvents() {
	const input = document.querySelector(".dropdown-input");
	const list = document.querySelector(".dropdown-list");

	input.addEventListener("input", () => {
		const filter = input.value.toLowerCase();
		const listItems = list.querySelectorAll("li");
		let listHasVisibleItems = false;
		listItems.forEach((item) => {
			const text = item.textContent.toLowerCase();
			const isVisible = text.includes(filter);
			item.style.display = isVisible ? "" : "none";
			if (isVisible) listHasVisibleItems = true;
		});
		//list.style.display = listHasVisibleItems ? "" : "none";
	});

	input.addEventListener("click", () => {
		list.style.display = "block";
	});

	list.addEventListener("click", (event) => {
		if (event.target.tagName === "LI") {
			document.querySelector(
				".selected-item-header"
			).textContent = `Selected: ${event.target.textContent}`; // Update the selected item label

			//get all npcs that have loot that matches the id of the selected item
			const selectedItemId = event.target.dataset.itemId;
			const npcsWithLoot = filterNpcsByLoot(npcsArray, selectedItemId);
			const npcboxdiv = createNpcBox(npcsWithLoot, event.target.textContent);

			filteredNpcsPanel.innerHTML = "";
			filteredNpcsPanel.appendChild(npcboxdiv);
			loadLocalStorageKills();
			list.style.display = "none";
		}
	});
	input.addEventListener("focusout", () => {
		//delay the hiding of the list so that the click event on the list can be triggered
		setTimeout(() => {
			list.style.display = "none";
		}, 100);
	});
}

function filterNpcsByLoot(npcs, itemId) {
	return npcs.filter((npc) =>
		npc.Loot.some((lootItem) => lootItem.ItemId == itemId)
	);
}

function createSettingsUI(npcs) {
	const npcLocations = [...new Set(npcs.map((npc) => npc.NpcArea))];

	npcLocations.forEach((npcLocation) => {
		const filteredNpcs = npcs.filter((npc) => npc.NpcArea === npcLocation);
		const npcBox = createNpcBox(filteredNpcs, npcLocation);
		npcBox.id = npcLocation; // Set the ID to the location for unique identification if needed
		settingsTabContent.appendChild(npcBox);
	});

	loadLocalStorageKills();
}

function createNpcBox(npcs, headerText) {
	const npcBoxDiv = document.createElement("div");
	npcBoxDiv.classList.add("npc-area-panel");

	const npcBoxHeader = document.createElement("h2");
	npcBoxHeader.textContent = prettifyString(headerText);

	const npcBoxContentList = document.createElement("ul");
	npcBoxContentList.classList.add("npc-content-list");

	npcBoxDiv.appendChild(npcBoxHeader);
	npcBoxDiv.appendChild(npcBoxContentList);

	npcs.forEach((npc) => {
		const npcListItem = document.createElement("li");
		npcListItem.textContent = `${prettifyString(npc.Name)}: `;

		const npcInput = document.createElement("input");
		npcInput.type = "number";
		npcInput.dataset.npcName = npc.Name;

		npcInput.addEventListener("change", saveLocalStorageKills);

		npcListItem.appendChild(npcInput);
		npcBoxContentList.appendChild(npcListItem);
	});

	return npcBoxDiv;
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
	const npcInputs = document.querySelectorAll(
		"#settingsTabContent input[data-npc-name]"
	);

	const filteredNpcInputs = document.querySelectorAll(
		"#calculateTabContent input[data-npc-name]"
	);
	if (
		filteredNpcInputs.length > 0 &&
		calculateTabContent.classList.contains("active")
	) {
		filteredNpcInputs.forEach((input) => {
			if (input.value !== "") {
				const npcName = input.dataset.npcName;
				const npcKillsValue = input.value;
				const npcInput = document.querySelector(
					`#settingsTabContent input[data-npc-name="${npcName}"]`
				);
				npcInput.value = npcKillsValue;
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
}
