import { getStoredKills } from "./storage.js";

export function filterNpcsByLoot(npcs, itemId) {
    return npcs.filter((npc) => npc.Loot.some((lootItem) => lootItem.ItemId == itemId));
}

export function calculateDropRates(targetItemId, npcsArray) {
    const npcsWithLoot = filterNpcsByLoot(npcsArray, targetItemId);
    const npcsKills = getStoredKills();

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
    return resultsArray;
}

export function calculateMonsterLoot(monsterName, npcsArray, itemsArray) {
    const npc = npcsArray.find((npc) => npc.Name === monsterName);
    const npcsKills = getStoredKills();
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

    return { lootTable, totalGoldValue };
}

export function calculateMonsterLootWithMarketPrices(monsterName, npcsArray, itemsArray, marketPrices) {
    const npc = npcsArray.find((npc) => npc.Name === monsterName);
    const npcsKills = getStoredKills();
    const killsPerHour = npcsKills[monsterName] || 0;
    let totalProfitValue = 0;

    // Create a map for faster price lookups
    const priceMap = new Map();
    if (marketPrices) {
        marketPrices.forEach(price => {
            priceMap.set(price.itemId, price.lowestSellPrice); // Using lowest sell price as a conservative estimate
        });
    }

    const lootTable = npc.Loot.map((lootItem) => {
        const item = itemsArray.find((item) => item.ItemId === lootItem.ItemId);
        const averageQuantity = (lootItem.ItemAmountMin + lootItem.ItemAmountMax) / 2;
        const dropsPerHour = ((averageQuantity * lootItem.Weight) / 100) * killsPerHour;

        // Use market price if available, otherwise fallback to GoldValue (or 0 if we want to be strict)
        // The user wants "Market Test", so let's prefer market price.
        const marketPrice = priceMap.get(item.ItemId) || 0;

        const profitPerHour = dropsPerHour * marketPrice;
        totalProfitValue += profitPerHour;

        return {
            itemName: item.Name,
            dropChance: lootItem.Weight,
            marketPrice: marketPrice,
            dropsPerHour: dropsPerHour,
            profitPerHour: profitPerHour,
            dropsPerDay: dropsPerHour * 24,
            profitPerDay: profitPerHour * 24,
        };
    });

    lootTable.sort((a, b) => b.profitPerHour - a.profitPerHour); // Sort by profit

    return { lootTable, totalProfitValue };
}
