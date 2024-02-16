// UIRender.js
import { prettifyString } from "./helpers.js";

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
		const tdDropsPerKill = document.createElement("td");

		tdNpcName.textContent = prettifyString(npc.npcName);
		tdKillsPerHour.textContent = npc.killsPerHour;
		tdDropPerHour.textContent = npc.dropRate.toFixed(2);
		tdDropsPer6Hours.textContent = (npc.dropRate * 6).toFixed(2);
		tdDropsPerKill.textContent = npc.dropsPerKill.toFixed(2);

		tr.appendChild(tdNpcName);
		tr.appendChild(tdKillsPerHour);
		tr.appendChild(tdDropPerHour);
		tr.appendChild(tdDropsPer6Hours);
		tr.appendChild(tdDropsPerKill);

		fragment.appendChild(tr);
	});
	return fragment;
}
