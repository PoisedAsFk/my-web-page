import { createDropdownItems, createNpcsTable, createNpcBox } from "./UIRender.js";

//Johnny Bingström, idle clans drops projekt för grundläggande javascriptprogrammering examination uppgift

//Kod för att ladda alla dom element så att jag kan referera till dem i koden enkelt.
//Behöver inte oroa mig så mycket om att koden körs innan elementen finns i DOMen.
//Koden kommer att köras när DOMen är klar, då detta är en modul vilket automatisk har "defer" inbyggt. (plus lite andra saker såsom strict mode)
//Denna kod är skriven i en modul för att kunna använda "import" och "export" för att dela upp koden i flera filer.
const calculateTab = document.getElementById("calculateTab");
const settingsTab = document.getElementById("settingsTab");
const calculateTabContent = document.getElementById("calculateTabContent");
const settingsTabContent = document.getElementById("settingsTabContent");
const filteredNpcsPanel = document.querySelector(".filtered-npc-panel");
const dropdownList = document.querySelector(".dropdown-list");
const dropdownInput = document.querySelector(".dropdown-input");
const npcTableBody = document.querySelector(".npc-table-body");
const selectedItemHeader = document.querySelector(".selected-item-header");
//Egentligen hade jag tänkt att kanske lägga in alla dessa dom variablar i ett object för att hålla koden "ren", men detta är en så pass liten kodbas att det inte känns nödvändigt.
//och egentligen skulle göra koden mer verbos utan att tillföra så mycket. Men ifall jag fortsätter att expandera denna kodbas så skulle jag nog göra det. Detta gäller även för de globala variablarna nedan.
//samt event listerners och liknande saker.

//Globala variablar för att ha enkelt tillgång till datan som vi får från fetch genom hela applikationen.
let npcsArray = [];
let itemsArray = [];

//Funktion för att hämta data från en url, används för att hämta npcs och items data från de json filer jag har i data mappen.
async function fetchData(url) {
	try {
		const response = await fetch(url);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Error fetching data from ${url}:`, error);
	}
}

//Funktion för att initialisera applikationen starta och ladda allt som behövs för att den ska fungera
//hämta npcs och items data, skapa de olika UI element, sätta upp event listeners och laddar local storage.
async function setupApp() {
	npcsArray = await fetchData("data/npcdata.json");
	itemsArray = await fetchData("data/itemdata.json");

	//Om vi har fått data från fetch så skapar vi UI elementen och sätter upp event listeners
	if (npcsArray && itemsArray) {
		createSettingsUI(npcsArray);
		//event listeners för att hantera att byta mellan tabbarna
		calculateTab.addEventListener("click", () => toggleActiveTab(calculateTab, "calculateTabContent"));
		settingsTab.addEventListener("click", () => toggleActiveTab(settingsTab, "settingsTabContent"));

		dropdownList.appendChild(createDropdownItems(itemsArray));
		dropdownInput.addEventListener("click", () => (dropdownList.style.display = "block")); //visa dropdown listan när man klickar på input fältet
		dropdownInput.addEventListener("input", () => filterDropdownList(dropdownInput, dropdownList)); //filterar dropdown listan när användaren skriver in text
		dropdownInput.addEventListener("focusout", () => setTimeout(() => (dropdownList.style.display = "none"), 150)); //gömmer listan när den inte är i fokus längre (som när man klickar utanför eller väljer ett item) Delay på 150ms för att annars kan fokusen ta bort listan innan koden för selektionen köras.
		dropdownList.addEventListener("click", (event) => handleDropdownSelection(event)); //hanterar valet av item i dropdown listan

		//Laddar local storage för npc kills och ifall det finns data i localstorage så laddas detta in i input fälten, annars sätts allt till 0.
		loadLocalStorageKills();
	}
}

setupApp();

function toggleActiveTab(clickedTab, contentId) {
	const tabs = document.querySelectorAll(".tab");
	const contents = document.querySelectorAll(".tab-content");

	//ta bort active class från alla tabs och tab contents
	tabs.forEach((tab) => tab.classList.remove("active"));
	contents.forEach((content) => content.classList.remove("active"));

	//lägg till active class på den tab och content som användaren klickat på
	clickedTab.classList.add("active");
	document.getElementById(contentId).classList.add("active");
	loadLocalStorageKills();
	//laddar localstorage när en tab klickas så att vi ser till att input fälten alltid är uppdaterade med senaste data.

	//active är en klass vi har skapat i css för att visa vilken tab som är aktiv och ifall de inte har active så kommer de inte att visas.
}

//Funktion för att filtrera dropdown listan när användaren skriver in text
function filterDropdownList(input, list) {
	const filter = input.value.toLowerCase();
	const listItems = list.querySelectorAll("li");
	listItems.forEach((item) => {
		//om texten i list itemen innehåller texten som användaren skrivit in så visas den, annars göms den. Detta genom en ternary operator som sätter display till "" eller "none"
		const text = item.textContent.toLowerCase();
		item.style.display = text.includes(filter) ? "" : "none";
	});
}

//Funktion för att hantera valet av item i dropdown listan
function handleDropdownSelection(event) {
	if (event.target.tagName === "LI") {
		//om användaren klickar på en li i listan så sätts input fältet till det som användaren valt och listan göms.
		//därefter uppdateras allt som behöver uppdateras för det valda itemet.
		//itemid är en data attribut som vi sätter på varje li element när vi skapar listan dynamiskt för att kunna hämta det enkelt.
		const selectedItemId = event.target.dataset.itemId;
		const selectedItemText = event.target.textContent;
		selectedItemHeader.textContent = `Selected: ${selectedItemText}`;
		//filtrerar npcs baserat på valt item och uppdaterar sedan panelen med dessa npcs, samt uppdaterar npc tabellen.
		//mer detaljerat så ser det till så att vi bara visar npcs som har loot för det valda item.
		const npcsWithLoot = filterNpcsByLoot(npcsArray, selectedItemId);
		updateFilteredNpcsPanel(npcsWithLoot, selectedItemText);
		updateNpcsTable(selectedItemId);
	}
}

//Funktion för att filtrera npcs baserat på valt item
function filterNpcsByLoot(npcs, itemId) {
	return npcs.filter((npc) => npc.Loot.some((lootItem) => lootItem.ItemId == itemId));
	//returnerar en array med npcs som har det valda item i sin loot array.
}

//Funktion för att uppdatera panelen med npcs som har loot för det valda itemet
//detta är panelen som visas på "main" tabben där användaren kan se vilka npcs som har loot för det valda itemet och ändra detta utan att behöva gå över till settings tabben.
function updateFilteredNpcsPanel(npcsWithLoot, selectedItemText) {
	const npcboxFragment = createNpcBox(npcsWithLoot, selectedItemText, saveLocalStorageKills);
	filteredNpcsPanel.innerHTML = "";
	filteredNpcsPanel.appendChild(npcboxFragment);
	loadLocalStorageKills();
}

//Funktion för att uppdatera npc tabellen baserat på valt item
function updateNpcsTable(selectedItemId) {
	const npcsLootArray = calculateDropRates(selectedItemId);
	npcTableBody.innerHTML = "";
	const tableFragment = createNpcsTable(npcsLootArray);
	npcTableBody.appendChild(tableFragment);
}

//funktion för att räkna ut drop rates för ett valt item för varje npc som droppar den och genom att använda de npc kills som finns i localstorage.
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

//Funktion för att skapa settings UI elementen i settings tabben baserat på npcs data
function createSettingsUI(npcs) {
	//hämtar alla unika npc locations från npcs datan för att gruppera npcs i settings tabben efter deras "location" i spelet.
	//dvs vilken zon de finns i. Detta för att göra det lättare för användaren att hitta npcs i listan.
	// Detta fungerar enkelt genom att använda en set för att ta bort dubletter och sedan skapa en array av detta. Set tillåter inte dubletter.
	const npcLocations = [...new Set(npcs.map((npc) => npc.NpcArea))];

	npcLocations.forEach((npcLocation) => {
		const filteredNpcs = npcs.filter((npc) => npc.NpcArea === npcLocation);
		const npcBoxFragment = createNpcBox(filteredNpcs, npcLocation, saveLocalStorageKills);
		settingsTabContent.appendChild(npcBoxFragment);
	});
}

//Funktioner för att ladda och spara npc kills i localstorage
//Tror jag kanske går lite väl hårt på att ladda och spara localstorage så mycket, men jag ville vara 110% säker att datan alltid var uppdaterad och sparad. Speciellt mellan de 2 olika tabbarna.
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
