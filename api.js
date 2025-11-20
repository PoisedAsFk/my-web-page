export async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
    }
}

export async function fetchMarketPrices() {
    try {
        // Using a CORS proxy or assuming the user's browser allows this request.
        // If CORS is an issue, we might need a different approach, but for now we try direct.
        // The user mentioned "using the official api", so we use the official endpoint.
        const response = await fetch("https://query.idleclans.com/api/PlayerMarket/items/prices/latest");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching market prices:", error);
        return null;
    }
}
