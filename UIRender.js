import { prettifyString, convertDropsPerHourToTime } from "./helpers.js";

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

export function createNpcsTable(npcsLootArray) {
	const fragment = document.createDocumentFragment();
	npcsLootArray.forEach((npc) => {
		const tr = document.createElement("tr");
		const tdNpcName = document.createElement("td");
		const tdKillsPerHour = document.createElement("td");
		const tdDropPerHour = document.createElement("td");
		const tdDropsPer6Hours = document.createElement("td");
		const tdAvgEtaForDrop = document.createElement("td");
		const tdAvgKillsForDrop = document.createElement("td");

		tdNpcName.textContent = prettifyString(npc.npcName);
		tdKillsPerHour.textContent = npc.killsPerHour;
		tdDropPerHour.textContent = npc.dropRate.toFixed(2);
		tdDropsPer6Hours.textContent = (npc.dropRate * 6).toFixed(2);
		tdAvgEtaForDrop.textContent = convertDropsPerHourToTime(npc.dropRate);
		tdAvgKillsForDrop.textContent = npc.dropsPerKill > 0 ? (1 / npc.dropsPerKill).toFixed(0) : "N/A";

		tr.appendChild(tdNpcName);
		tr.appendChild(tdKillsPerHour);
		tr.appendChild(tdDropPerHour);
		tr.appendChild(tdDropsPer6Hours);
		tr.appendChild(tdAvgEtaForDrop);
		tr.appendChild(tdAvgKillsForDrop);

		fragment.appendChild(tr);
	});
	return fragment;
}

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
