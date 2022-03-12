const colorPreview = document.querySelector(".color-preview");
const colorInput = document.querySelector(".color-input");
const savedColors = document.querySelector(".saved-colors");

colorInput.addEventListener("keyup", updatePreview);

savedColors.addEventListener("click", (e) => {
	colorInput.value = e.target.getAttribute("value");
	updatePreview();
});

function updatePreview() {
	colorPreview.style.background = colorInput.value;
}
