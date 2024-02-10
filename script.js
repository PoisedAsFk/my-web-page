import { prettifyString } from "./helpers.js";

const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const calculateTabContent = document.getElementById("calculateTabContent");
const settingsTabContent = document.getElementById("settingsTabContent");
const lootItemDatalist = document.getElementById("loot-item-options");

fetch("data/npcdata.json")
	.then((response) => response.json())
	.then((npcs) => {
		createSettingsUI(npcs);
	})
	.catch((error) => console.error("Error fetching NPCs:", error));

fetch("data/itemdata.json") // Adjust the path as necessary
	.then((response) => response.json())
	.then((items) => {
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
