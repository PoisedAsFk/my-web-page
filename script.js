import { prettifyString } from "./helpers.js";
import { createDropdownItems, createNpcsTable } from "./UIRender.js";

const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const calculateTabContent = document.getElementById("calculateTabContent");
const settingsTabContent = document.getElementById("settingsTabContent");
const lootItemDatalist = document.getElementById("loot-item-options");
const filteredNpcsPanel = document.querySelector(".filtered-npc-panel");
const dropdownList = document.querySelector(".dropdown-list");
const npcTableBody = document.querySelector(".npc-table-body");

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

async function main() {
	npcsArray = await fetchData("data/npcdata.json");
	itemsArray = await fetchData("data/itemdata.json");

	if (npcsArray && itemsArray) {
		createSettingsUI(npcsArray);
		dropdownList.appendChild(createDropdownItems(itemsArray));
		initDropdownEvents();
		initTabEvents();
	}
}

main();

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

// Function to initialize tab events
function initTabEvents() {
	calculateTab.addEventListener("click", () => toggleActiveTab(calculateTab, "calculateTabContent"));
	settingsTab.addEventListener("click", () => toggleActiveTab(settingsTab, "settingsTabContent"));
}

// Refactored initDropdownEvents function
function initDropdownEvents() {
	const input = document.querySelector(".dropdown-input");
	const list = document.querySelector(".dropdown-list");

	// Initialize input filter event
	input.addEventListener("input", () => filterDropdownItems(input, list));

	// Show list on input click
	input.addEventListener("click", () => (list.style.display = "block"));

	// Handle list item selection
	list.addEventListener("click", (event) => handleDropdownSelection(event, list));

	// Hide list on input focus out, with delay to allow click event
	input.addEventListener("focusout", () => setTimeout(() => (list.style.display = "none"), 150));
}

// Define the filterDropdownItems function to filter dropdown items based on input
function filterDropdownItems(input, list) {
	const filter = input.value.toLowerCase();
	const listItems = list.querySelectorAll("li");
	let listHasVisibleItems = false;
	listItems.forEach((item) => {
		const text = item.textContent.toLowerCase();
		const isVisible = text.includes(filter);
		item.style.display = isVisible ? "" : "none";
		if (isVisible) listHasVisibleItems = true;
	});
}

// Define the handleDropdownSelection function to handle selection from the dropdown
function handleDropdownSelection(event, list) {
	if (event.target.tagName === "LI") {
		const selectedItemId = event.target.dataset.itemId;
		selectItemAndUpdateUI(selectedItemId, event.target.textContent, list);
	}
}

// Define the selectItemAndUpdateUI function to update UI based on item selection
function selectItemAndUpdateUI(selectedItemId, selectedItemText, list) {
	document.querySelector(".selected-item-header").textContent = `Selected: ${selectedItemText}`;
	const npcsWithLoot = filterNpcsByLoot(npcsArray, selectedItemId);
	updateFilteredNpcsPanel(npcsWithLoot, selectedItemText);
	list.style.display = "none";
	updateNpcsDropRatesTable(selectedItemId);
}

function filterNpcsByLoot(npcs, itemId) {
	return npcs.filter((npc) => npc.Loot.some((lootItem) => lootItem.ItemId == itemId));
}

// Define the updateFilteredNpcsPanel function to update the filtered NPCs panel
function updateFilteredNpcsPanel(npcsWithLoot, selectedItemText) {
	const npcboxdiv = createNpcBox(npcsWithLoot, selectedItemText);
	filteredNpcsPanel.innerHTML = "";
	filteredNpcsPanel.appendChild(npcboxdiv);
	loadLocalStorageKills();
}

// Define the updateNpcsDropRatesTable function to update NPCs drop rates table
function updateNpcsDropRatesTable(selectedItemId) {
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
