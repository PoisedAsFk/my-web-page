export const prettifyString = (str) => {
	return str
		.replace(/_/g, " ")
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export function convertDropsPerHourToTime(dropsPerHour) {
	if (dropsPerHour == 0) {
		return "N/A";
	}

	//räknar ut hur många minuter det tar för ett drop
	let minutesPerDrop = 60 / dropsPerHour;

	//räknar ut hur många timmar och minuter det tar för ett drop
	let hours = Math.floor(minutesPerDrop / 60);
	let minutes = Math.floor(minutesPerDrop % 60);

	//skapar en sträng som innehåller tiden det tar för ett drop
	let timeString = "";
	if (hours > 0) {
		timeString += hours.toString().padStart(2, "0") + "h:";
	}
	timeString += minutes.toString().padStart(2, "0") + "m";

	return timeString;
}
