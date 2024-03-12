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

	// Convert drops per hour to minutes per drop
	let minutesPerDrop = 60 / dropsPerHour;

	// Calculate hours and minutes
	let hours = Math.floor(minutesPerDrop / 60);
	let minutes = Math.floor(minutesPerDrop % 60);

	// Format the time string
	let timeString = "";
	if (hours > 0) {
		timeString += hours.toString().padStart(2, "0") + "h:";
	}
	timeString += minutes.toString().padStart(2, "0") + "m";

	return timeString;
}
