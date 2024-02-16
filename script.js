import { prettifyString } from "./helpers.js";
import { createDropdownItems, createNpcsTable, createNpcBox } from "./UIRender.js";

const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const calculateTabContent = document.getElementById("calculateTabContent");
const settingsTabContent = document.getElementById("settingsTabContent");
const filteredNpcsPanel = document.querySelector(".filtered-npc-panel");
const dropdownList = document.querySelector(".dropdown-list");
const dropdownInput = document.querySelector(".dropdown-input");
const npcTableBody = document.querySelector(".npc-table-body");
const selectedItemHeader = document.querySelector(".selected-item-header");

let npcsArray = [];
let itemsArray = [];

async function fetchData(url) {
	try {
		const response = await fetch(url);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Error fetching data from ${url}:`, error);
	}
}

async function setupApp() {
	npcsArray = await fetchData("data/npcdata.json");
	itemsArray = await fetchData("data/itemdata.json");

	if (npcsArray && itemsArray) {
		createSettingsUI(npcsArray);
		calculateTab.addEventListener("click", () => toggleActiveTab(calculateTab, "calculateTabContent"));
		settingsTab.addEventListener("click", () => toggleActiveTab(settingsTab, "settingsTabContent"));

		dropdownList.appendChild(createDropdownItems(itemsArray));
		dropdownInput.addEventListener("click", () => (dropdownList.style.display = "block")); // Show list on input click
		dropdownInput.addEventListener("input", () => filterDropdownList(dropdownInput, dropdownList)); // Initialize input filter event
		dropdownInput.addEventListener("focusout", () => setTimeout(() => (dropdownList.style.display = "none"), 150)); // Hide list on input focus out, with delay to allow click event
		dropdownList.addEventListener("click", (event) => handleDropdownSelection(event)); // Handle list item selection

		loadLocalStorageKills();
	}
}

setupApp();

// Function to toggle the active class for tabs and content
function toggleActiveTab(clickedTab, contentId) {
	const tabs = document.querySelectorAll(".tab");
	const contents = document.querySelectorAll(".tab-content");

	// Remove active class from all tabs and contents
	tabs.forEach((tab) => tab.classList.remove("active"));
	contents.forEach((content) => content.classList.remove("active"));

	// Add active class to the clicked tab and the corresponding content
	clickedTab.classList.add("active");
	document.getElementById(contentId).classList.add("active");
	loadLocalStorageKills();
}

// Define the filterDropdownItems function to filter dropdown items based on input
function filterDropdownList(input, list) {
	const filter = input.value.toLowerCase();
	const listItems = list.querySelectorAll("li");
	listItems.forEach((item) => {
		const text = item.textContent.toLowerCase();
		item.style.display = text.includes(filter) ? "" : "none";
	});
}

// Define the handleDropdownSelection function to handle selection from the dropdown
function handleDropdownSelection(event) {
	if (event.target.tagName === "LI") {
		const selectedItemId = event.target.dataset.itemId;
		const selectedItemText = event.target.textContent;
		selectedItemHeader.textContent = `Selected: ${selectedItemText}`;
		const npcsWithLoot = filterNpcsByLoot(npcsArray, selectedItemId);
		updateFilteredNpcsPanel(npcsWithLoot, selectedItemText);
		updateNpcsTable(selectedItemId);
	}
}

function filterNpcsByLoot(npcs, itemId) {
	return npcs.filter((npc) => npc.Loot.some((lootItem) => lootItem.ItemId == itemId));
}

// Define the updateFilteredNpcsPanel function to update the filtered NPCs panel
function updateFilteredNpcsPanel(npcsWithLoot, selectedItemText) {
	const npcboxdiv = createNpcBox(npcsWithLoot, selectedItemText, saveLocalStorageKills);
	filteredNpcsPanel.innerHTML = "";
	filteredNpcsPanel.appendChild(npcboxdiv);
	loadLocalStorageKills();
}

// Define the updateNpcsDropRatesTable function to update NPCs drop rates table
function updateNpcsTable(selectedItemId) {
	const npcsLootArray = calculateDropRates(selectedItemId);
	npcTableBody.innerHTML = "";
	const tableFragment = createNpcsTable(npcsLootArray);
	npcTableBody.appendChild(tableFragment);
}

function calculateDropRates(targetItemId) {
	const npcsWithLoot = filterNpcsByLoot(npcsArray, targetItemId);
	const npcsKills = JSON.parse(localStorage.getItem("npcKills")) || {};
	const selectedItemDetails = itemsArray.find((item) => item.ItemId == targetItemId);

	const resultsArray = [];

	npcsWithLoot.forEach((npc) => {
		const currentNpcKills = npcsKills[npc.Name] || 0;

		const lootData = npc.Loot.find((lootItem) => lootItem.ItemId == targetItemId);
		const averageQuantity = (lootData.ItemAmountMin + lootData.ItemAmountMax) / 2;

		const itemDropsPerKill = (averageQuantity * lootData.Weight) / 100;

		const itemDropsPerHour = itemDropsPerKill * currentNpcKills;

		const npcDropStats = {
			npcName: npc.Name,
			dropRate: itemDropsPerHour,
			dropsPerKill: itemDropsPerKill,
			killsPerHour: currentNpcKills,
		};

		resultsArray.push(npcDropStats);
	});
	resultsArray.sort((a, b) => b.dropRate - a.dropRate);
	console.log(resultsArray);
	return resultsArray;
}

function createSettingsUI(npcs) {
	const npcLocations = [...new Set(npcs.map((npc) => npc.NpcArea))];

	npcLocations.forEach((npcLocation) => {
		const filteredNpcs = npcs.filter((npc) => npc.NpcArea === npcLocation);
		const npcBox = createNpcBox(filteredNpcs, npcLocation, saveLocalStorageKills);
		npcBox.id = npcLocation; // Set the ID to the location for unique identification if needed
		settingsTabContent.appendChild(npcBox);
	});
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
	const npcInputs = document.querySelectorAll("#settingsTabContent input[data-npc-name]");

	const filteredNpcInputs = document.querySelectorAll("#calculateTabContent input[data-npc-name]");
	if (filteredNpcInputs.length > 0 && calculateTabContent.classList.contains("active")) {
		filteredNpcInputs.forEach((input) => {
			if (input.value !== "") {
				const npcName = input.dataset.npcName;
				const npcKillsValue = input.value;
				const npcInput = document.querySelector(`#settingsTabContent input[data-npc-name="${npcName}"]`);
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
