import {
	createDropdownItems,
	createNpcsTable,
	createNpcBox,
	createMonsterDropdownItems,
	createMonsterLootTable,
} from "./UIRender.js";

const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const monsterLootTab = document.getElementById("monsterLootTab");
const calculateTabContent = document.getElementById("calculateTabContent");
const settingsTabContent = document.getElementById("settingsTabContent");
const monsterLootTabContent = document.getElementById("monsterLootTabContent");
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
		monsterLootTab.addEventListener("click", () => toggleActiveTab(monsterLootTab, "monsterLootTabContent"));

		dropdownList.appendChild(createDropdownItems(itemsArray));
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

		loadLocalStorageKills();
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
	loadLocalStorageKills();
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
		const selectedItemText = event.target.textContent;
		selectedItemHeader.textContent = `Selected: ${selectedItemText}`;
		const npcsWithLoot = filterNpcsByLoot(npcsArray, selectedItemId);
		updateFilteredNpcsPanel(npcsWithLoot, selectedItemText);
		updateNpcsTable(selectedItemId);
	}
}

function handleMonsterSelection(event) {
	if (event.target.tagName === "LI") {
		const selectedMonsterName = event.target.dataset.npcName;
		selectedMonsterHeader.textContent = `Selected: ${selectedMonsterName}`;
		calculateMonsterLoot(selectedMonsterName);
	}
}

function filterNpcsByLoot(npcs, itemId) {
	return npcs.filter((npc) => npc.Loot.some((lootItem) => lootItem.ItemId == itemId));
}

//updates/creates the npc panel with npcs filtered by loot/item selected
function updateFilteredNpcsPanel(npcsWithLoot, selectedItemText) {
	const npcboxFragment = createNpcBox(npcsWithLoot, selectedItemText, saveLocalStorageKills);
	filteredNpcsPanel.innerHTML = "";
	filteredNpcsPanel.appendChild(npcboxFragment);
	loadLocalStorageKills();
}

//update/create npc table
function updateNpcsTable(selectedItemId) {
	const npcsLootArray = calculateDropRates(selectedItemId);
	npcTableBody.innerHTML = "";
	const tableFragment = createNpcsTable(npcsLootArray);
	npcTableBody.appendChild(tableFragment);
}

function calculateDropRates(targetItemId) {
	const npcsWithLoot = filterNpcsByLoot(npcsArray, targetItemId);
	const npcsKills = JSON.parse(localStorage.getItem("npcKills")) || {};

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

function calculateMonsterLoot(monsterName) {
	const npc = npcsArray.find((npc) => npc.Name === monsterName);
	const npcsKills = JSON.parse(localStorage.getItem("npcKills")) || {};
	const killsPerHour = npcsKills[monsterName] || 0;
	let totalGoldValue = 0;

	const lootTable = npc.Loot.map((lootItem) => {
		const item = itemsArray.find((item) => item.ItemId === lootItem.ItemId);
		const averageQuantity = (lootItem.ItemAmountMin + lootItem.ItemAmountMax) / 2;
		const dropsPerHour = ((averageQuantity * lootItem.Weight) / 100) * killsPerHour;
		const goldValuePerHour = dropsPerHour * item.GoldValue;
		totalGoldValue += goldValuePerHour;

		return {
			itemName: item.Name,
			dropChance: lootItem.Weight,
			averageGoldValue: averageQuantity * item.GoldValue,
			dropsPerHour: dropsPerHour,
			goldValuePerHour: goldValuePerHour,
			dropsPer6Hours: dropsPerHour * 6,
			goldValuePer6Hours: goldValuePerHour * 6,
			dropsPerDay: dropsPerHour * 24,
			goldValuePerDay: goldValuePerHour * 24,
		};
	});

	lootTable.sort((a, b) => b.dropChance - a.dropChance);

	monsterLootTableBody.innerHTML = "";
	const tableFragment = createMonsterLootTable(lootTable);
	monsterLootTableBody.appendChild(tableFragment);
	totalGold.textContent = totalGoldValue.toFixed(2);
}

function createSettingsUI(npcs) {
	const npcLocations = [...new Set(npcs.map((npc) => npc.NpcArea))];

	npcLocations.forEach((npcLocation) => {
		const filteredNpcs = npcs.filter((npc) => npc.NpcArea === npcLocation);
		const npcBoxFragment = createNpcBox(filteredNpcs, npcLocation, saveLocalStorageKills);
		settingsTabContent.appendChild(npcBoxFragment);
	});
}

//Loads the kills from local storage, if none create the object and set to 0
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
