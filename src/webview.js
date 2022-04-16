const colorPreview = document.querySelector(".color-preview");
const hexInput = document.querySelector("#hex-input");
const savedColorsContainer = document.querySelector(".saved-colors");
const savedColors = document.querySelectorAll(".saved-color");
const redRange = document.querySelector("#r-range");
const greenRange = document.querySelector("#g-range");
const blueRange = document.querySelector("#b-range");
const redInput = document.querySelector("#r-input");
const greenInput = document.querySelector("#g-input");
const blueInput = document.querySelector("#b-input");
const savedColorsChangesInput = document.querySelector(".saved-colors-changes");
const saveColor = document.querySelector(".save-color");

let hex = {
	red: "7f",
	green: "7f",
	blue: "7f",
};

let savedColorsChanges = { add: [], remove: [] };

hexInput.addEventListener("keyup", handleHexInput);

redRange.addEventListener("input", (e) => handleRange(e.target));
greenRange.addEventListener("input", (e) => handleRange(e.target));
blueRange.addEventListener("input", (e) => handleRange(e.target));

redInput.addEventListener("keyup", handleRgbInput);
greenInput.addEventListener("keyup", handleRgbInput);
blueInput.addEventListener("keyup", handleRgbInput);

saveColor.addEventListener("click", saveNewColor);

savedColors.forEach((el) => {
	el.addEventListener("click", applySavedColor);
	el.addEventListener("contextmenu", removeSavedColor);
});

function updatePreview() {
	colorPreview.style.background = hexInput.value;
}

function handleRange(range) {
	const value = +range.value;
	const percentage = (value * 100) / 255;

	let fillLeft = "";

	switch (range.id) {
		case "r-range":
			fillLeft = "#d68f99";
			redInput.value = value;
			hex.red = getHex(value);
			break;

		case "g-range":
			fillLeft = "#add68f";
			greenInput.value = value;
			hex.green = getHex(value);
			break;

		case "b-range":
			fillLeft = "#8fc2d6";
			blueInput.value = value;
			hex.blue = getHex(value);
			break;

		default:
			break;
	}

	range.style.background = `linear-gradient(to right, ${fillLeft} ${percentage}%, var(--joplin-odd-background-color) ${percentage}%)`;
	hexInput.value = `#${hex.red}${hex.green}${hex.blue}`;
	updatePreview();
}

function getHex(value) {
	hexValue = value.toString(16);

	return hexValue.length < 2 ? `0${hexValue}` : hexValue;
}

function handleRgbInput(e) {
	const input = e.target;
	const value = input.value !== "" ? input.value : 0;

	switch (input.id) {
		case "r-input":
			redRange.value = value;
			handleRange(redRange);
			break;

		case "g-input":
			greenRange.value = value;
			handleRange(greenRange);
			break;

		case "b-input":
			blueRange.value = value;
			handleRange(blueRange);
			break;

		default:
			break;
	}
}

function handleHexInput() {
	if (hexInput.value[0] !== "#") {
		hexInput.value = `#${hexInput.value}`;
	}

	const value = hexInput.value;

	updatePreview();

	if (value.length === 4) {
		redRange.value = parseInt(value[1] + value[1], 16);
		handleRange(redRange);

		greenRange.value = parseInt(value[2] + value[2], 16);
		handleRange(greenRange);

		blueRange.value = parseInt(value[3] + value[3], 16);
		handleRange(blueRange);

		hexInput.value = value;
	} else if (value.length === 7) {
		redRange.value = parseInt(value[1] + value[2], 16);
		handleRange(redRange);

		greenRange.value = parseInt(value[3] + value[4], 16);
		handleRange(greenRange);

		blueRange.value = parseInt(value[5] + value[6], 16);
		handleRange(blueRange);
	}
}

function applySavedColor(e) {
	e.preventDefault();

	hexInput.value = e.target.getAttribute("value");

	handleHexInput();
	updatePreview();
}

function removeSavedColor(e) {
	e.preventDefault();

	savedColorsChanges.remove.push(e.target.getAttribute("value"));

	savedColorsChangesInput.value = JSON.stringify(savedColorsChanges);

	e.target.remove();
}

function saveNewColor(e) {
	e.preventDefault();

	savedColorsChanges.add.push(hexInput.value);

	savedColorsChangesInput.value = JSON.stringify(savedColorsChanges);

	const node = document.createElement("button");
	node.classList.add("saved-color");
	node.value = hexInput.value;
	node.style.backgroundColor = hexInput.value;
	node.addEventListener("click", applySavedColor);
	node.addEventListener("contextmenu", removeSavedColor);

	savedColorsContainer.appendChild(node);
}

handleRange(redRange);
handleRange(greenRange);
handleRange(blueRange);
