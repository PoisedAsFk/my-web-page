import { fetchData, fetchMarketPrices } from "./api.js";
import { loadLocalStorageKills, saveLocalStorageKills } from "./storage.js";
import { calculateDropRates, calculateMonsterLoot, filterNpcsByLoot, calculateMonsterLootWithMarketPrices } from "./calculations.js";
import {
	createDropdownItems,
	createNpcsTable,
	createNpcBox,
	createMonsterDropdownItems,
	createMonsterLootTable,
	createMarketLootTable
} from "./UIRender.js";

const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const monsterLootTab = document.getElementById("monsterLootTab");
const marketTestTab = document.getElementById("marketTestTab");

const calculateTabContent = document.getElementById("calculateTabContent");
const settingsTabContent = document.getElementById("settingsTabContent");
const monsterLootTabContent = document.getElementById("monsterLootTabContent");
const marketTestTabContent = document.getElementById("marketTestTabContent");

const filteredNpcsPanel = document.querySelector(".filtered-npc-panel");
const dropdownList = document.querySelector(".dropdown-list");
const dropdownInput = document.querySelector(".dropdown-input");
const monsterDropdownList = document.querySelector(".monster-dropdown-list");
const monsterDropdownInput = document.querySelector(".monster-dropdown-input");
const npcTableBody = document.querySelector(".npc-table-body");
const selectedItemHeader = document.querySelector(".selected-item-header");
const selectedMonsterHeader = document.querySelector(".selected-monster-header");
const monsterLootTableBody = document.querySelector(".monster-loot-table-body");
const totalGold = document.getElementById("total-gold");

// Market Tab Elements
const marketMonsterDropdownList = document.querySelector(".market-monster-dropdown-list");
const marketMonsterDropdownInput = document.querySelector(".market-monster-dropdown-input");
const marketSelectedMonsterHeader = document.querySelector(".market-selected-monster-header");
const marketLootTableBody = document.querySelector(".market-loot-table-body");
const marketTotalProfit = document.getElementById("market-total-profit");
const marketLootDetails = document.querySelector(".market-loot-details");


// Elements to toggle visibility
const npcTableWrapper = document.querySelector(".npc-table").closest(".table-wrapper");
const monsterLootDetails = document.querySelector(".monster-loot-details");

let npcsArray = [];
let itemsArray = [];
let marketPrices = [];

// Global variable to track selected item
let currentSelectedItemId = null;

// Callback for storage updates
const onStorageUpdate = () => {
	if (currentSelectedItemId) {
		updateNpcsTable(currentSelectedItemId);
	}
};

// Bound save function to pass to UI components
const boundSaveLocalStorageKills = () => saveLocalStorageKills(onStorageUpdate);

async function setupApp() {
	npcsArray = await fetchData("data/npcdata.json");
	itemsArray = await fetchData("data/itemdata.json");

	if (npcsArray && itemsArray) {
		// Filter items to only those dropped by monsters
		const droppableItemIds = new Set();
		npcsArray.forEach(npc => {
			if (npc.Loot) {
				npc.Loot.forEach(loot => droppableItemIds.add(loot.ItemId));
			}
		});

		const filteredItemsArray = itemsArray.filter(item => droppableItemIds.has(item.ItemId));

		createSettingsUI(npcsArray);
		calculateTab.addEventListener("click", () => toggleActiveTab(calculateTab, "calculateTabContent"));
		settingsTab.addEventListener("click", () => toggleActiveTab(settingsTab, "settingsTabContent"));
		monsterLootTab.addEventListener("click", () => toggleActiveTab(monsterLootTab, "monsterLootTabContent"));
		marketTestTab.addEventListener("click", async () => {
			toggleActiveTab(marketTestTab, "marketTestTabContent");
			if (marketPrices.length === 0) {
				// Fetch prices when tab is first clicked
				marketPrices = await fetchMarketPrices();
				if (!marketPrices) {
					alert("Failed to fetch market prices. Please try again later.");
					marketPrices = [];
				}
			}
		});

		dropdownList.appendChild(createDropdownItems(filteredItemsArray));
		dropdownInput.addEventListener("click", () => (dropdownList.style.display = "block")); //Show list on  click
		dropdownInput.addEventListener("input", () => filterDropdownList(dropdownInput, dropdownList)); //filter dropdown on input
		dropdownInput.addEventListener("focusout", () => setTimeout(() => (dropdownList.style.display = "none"), 150)); //Hide list on focus out
		dropdownList.addEventListener("click", (event) => handleDropdownSelection(event)); //handle item selection

		monsterDropdownList.appendChild(createMonsterDropdownItems(npcsArray));
		monsterDropdownInput.addEventListener("click", () => (monsterDropdownList.style.display = "block"));
		monsterDropdownInput.addEventListener("input", () =>
			filterDropdownList(monsterDropdownInput, monsterDropdownList)
		);
		monsterDropdownInput.addEventListener("focusout", () =>
			setTimeout(() => (monsterDropdownList.style.display = "none"), 150)
		);
		monsterDropdownList.addEventListener("click", (event) => handleMonsterSelection(event));

		// Market Tab Dropdown
		marketMonsterDropdownList.appendChild(createMonsterDropdownItems(npcsArray));
		marketMonsterDropdownInput.addEventListener("click", () => (marketMonsterDropdownList.style.display = "block"));
		marketMonsterDropdownInput.addEventListener("input", () =>
			filterDropdownList(marketMonsterDropdownInput, marketMonsterDropdownList)
		);
		marketMonsterDropdownInput.addEventListener("focusout", () =>
			setTimeout(() => (marketMonsterDropdownList.style.display = "none"), 150)
		);
		marketMonsterDropdownList.addEventListener("click", (event) => handleMarketMonsterSelection(event));

		loadLocalStorageKills(onStorageUpdate);

		// Initial Visibility State
		npcTableWrapper.classList.add("hidden");
		filteredNpcsPanel.classList.add("hidden");
		monsterLootDetails.classList.add("hidden");
		marketLootDetails.classList.add("hidden");
	}
}

setupApp();

function toggleActiveTab(clickedTab, contentId) {
	const tabs = document.querySelectorAll(".tab");
	const contents = document.querySelectorAll(".tab-content");

	//Remove active from all tabs
	tabs.forEach((tab) => tab.classList.remove("active"));
	contents.forEach((content) => content.classList.remove("active"));

	//Add active class clicked tab
	clickedTab.classList.add("active");
	document.getElementById(contentId).classList.add("active");

	// Refresh kills when switching tabs to ensure sync
	loadLocalStorageKills(onStorageUpdate);
}

function filterDropdownList(input, list) {
	const filter = input.value.toLowerCase();
	const listItems = list.querySelectorAll("li");
	listItems.forEach((item) => {
		const text = item.textContent.toLowerCase();
		item.style.display = text.includes(filter) ? "" : "none";
	});
}

function handleDropdownSelection(event) {
	if (event.target.tagName === "LI") {
		const selectedItemId = event.target.dataset.itemId;
		currentSelectedItemId = selectedItemId; // Store selected item ID
		const selectedItemText = event.target.textContent;
		selectedItemHeader.textContent = `Selected: ${selectedItemText}`;
		const npcsWithLoot = filterNpcsByLoot(npcsArray, selectedItemId);
		updateFilteredNpcsPanel(npcsWithLoot, selectedItemText);
		updateNpcsTable(selectedItemId);

		// Show results
		npcTableWrapper.classList.remove("hidden");
		filteredNpcsPanel.classList.remove("hidden");
	}
}

function handleMonsterSelection(event) {
	if (event.target.tagName === "LI") {
		const selectedMonsterName = event.target.dataset.npcName;
		selectedMonsterHeader.textContent = `Selected: ${selectedMonsterName}`;
		updateMonsterLootTable(selectedMonsterName);

		// Show results
		monsterLootDetails.classList.remove("hidden");
	}
}

function handleMarketMonsterSelection(event) {
	if (event.target.tagName === "LI") {
		const selectedMonsterName = event.target.dataset.npcName;
		marketSelectedMonsterHeader.textContent = `Selected: ${selectedMonsterName}`;
		updateMarketLootTable(selectedMonsterName);

		// Show results
		marketLootDetails.classList.remove("hidden");
	}
}

//updates/creates the npc panel with npcs filtered by loot/item selected
function updateFilteredNpcsPanel(npcsWithLoot, selectedItemText) {
	const npcboxFragment = createNpcBox(npcsWithLoot, selectedItemText, boundSaveLocalStorageKills);
	filteredNpcsPanel.innerHTML = "";
	filteredNpcsPanel.appendChild(npcboxFragment);
	loadLocalStorageKills(onStorageUpdate);
}

//update/create npc table
function updateNpcsTable(selectedItemId) {
	const npcsLootArray = calculateDropRates(selectedItemId, npcsArray);
	npcTableBody.innerHTML = "";
	const tableFragment = createNpcsTable(npcsLootArray);
	npcTableBody.appendChild(tableFragment);
}

function updateMonsterLootTable(monsterName) {
	const { lootTable, totalGoldValue } = calculateMonsterLoot(monsterName, npcsArray, itemsArray);

	monsterLootTableBody.innerHTML = "";
	const tableFragment = createMonsterLootTable(lootTable);
	monsterLootTableBody.appendChild(tableFragment);
	totalGold.textContent = totalGoldValue.toFixed(2);
}

function updateMarketLootTable(monsterName) {
	const { lootTable, totalProfitValue } = calculateMonsterLootWithMarketPrices(monsterName, npcsArray, itemsArray, marketPrices);

	marketLootTableBody.innerHTML = "";
	const tableFragment = createMarketLootTable(lootTable);
	marketLootTableBody.appendChild(tableFragment);
	marketTotalProfit.textContent = totalProfitValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function createSettingsUI(npcs) {
	const npcLocations = [...new Set(npcs.map((npc) => npc.NpcArea))];

	npcLocations.forEach((npcLocation) => {
		const filteredNpcs = npcs.filter((npc) => npc.NpcArea === npcLocation);
		const npcBoxFragment = createNpcBox(filteredNpcs, npcLocation, boundSaveLocalStorageKills);
		settingsTabContent.appendChild(npcBoxFragment);
	});
}
