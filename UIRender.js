import { prettifyString, convertDropsPerHourToTime } from "./helpers.js";
//prettifystring är en funktion som tar en sträng och gör om den till en sträng med stor bokstav i början av varje ord samt tar bort _ och ersätter med mellanslag
//convertDropsPerHourToTime är en funktion som tar en siffra och omvandlar den till en sträng som visar hur lång tid det tar att få en drop med den hastigheten

//Funktionen createDropdownItems tar en array som argument och skapar en fragment som innehåller en lista med li-element som innehåller texten från arrayen samt en dataset med itemid så man enkelt kan komma åt det senare.
export function createDropdownItems(items) {
	const fragment = document.createDocumentFragment();
	items.forEach((item) => {
		const li = document.createElement("li");
		li.textContent = prettifyString(item.Name);
		li.dataset.itemId = item.ItemId;
		fragment.appendChild(li);
	});
	return fragment;
}

//Funktionen createNpcsTable tar en array som argument och skapar en fragment som innehåller en tabell med tr-element som innehåller td-element som innehåller texten från arrayen samt en dataset
//samt räknar ut de olika kalkulationerna som behövs för att visa hur lång tid det tar att få en drop.
export function createNpcsTable(npcsLootArray) {
	const fragment = document.createDocumentFragment();
	npcsLootArray.forEach((npc) => {
		const tr = document.createElement("tr");
		const tdNpcName = document.createElement("td");
		const tdKillsPerHour = document.createElement("td");
		const tdDropPerHour = document.createElement("td");
		const tdDropsPer6Hours = document.createElement("td");
		const tdAvgEtaForDrop = document.createElement("td");

		tdNpcName.textContent = prettifyString(npc.npcName);
		tdKillsPerHour.textContent = npc.killsPerHour;
		tdDropPerHour.textContent = npc.dropRate.toFixed(2);
		tdDropsPer6Hours.textContent = (npc.dropRate * 6).toFixed(2);
		tdAvgEtaForDrop.textContent = convertDropsPerHourToTime(npc.dropRate);

		tr.appendChild(tdNpcName);
		tr.appendChild(tdKillsPerHour);
		tr.appendChild(tdDropPerHour);
		tr.appendChild(tdDropsPer6Hours);
		tr.appendChild(tdAvgEtaForDrop);

		fragment.appendChild(tr);
	});
	return fragment;
}

//Funktionen createNpcBox tar en array, en sträng och en funktion som argument och skapar en fragment som innehåller en div med en h2 och en ul som innehåller li-element som innehåller en input
//funktionen är localstorage funktionen då det kan vara lite spännande att hantera funktioner osv mellan de olika filerna i moduler, så är det enklare att skicka med funktionen som argument.
//Detta är "boxarna" som innehåller npc namn samt inputfält för att mata in kills per hour datan. Som finns i settings tabben samt höger sidan utan calculate tabben när ett item är valt.
export function createNpcBox(npcs, headerText, saveLocalStorageKills) {
	const fragment = document.createDocumentFragment();
	const npcBoxDiv = document.createElement("div");
	npcBoxDiv.classList.add("npc-area-panel");

	const npcBoxHeader = document.createElement("h2");
	npcBoxHeader.textContent = prettifyString(headerText);
	npcBoxDiv.appendChild(npcBoxHeader);

	const npcBoxContentList = document.createElement("ul");
	npcBoxContentList.classList.add("npc-content-list");
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

	npcBoxDiv.id = headerText;
	fragment.appendChild(npcBoxDiv);
	return fragment;
}
