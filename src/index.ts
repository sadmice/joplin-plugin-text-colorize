import joplin from "api";
import { SettingItemType } from "api/types";

joplin.plugins.register({
	onStart: async function () {
		const dialogs = joplin.views.dialogs;
		const dialog = await dialogs.create("text-colorize-dialog");

		await dialogs.addScript(dialog, "./webview.js");
		await dialogs.addScript(dialog, "./webview.css");

		await dialogs.setButtons(dialog, [
			{
				id: "ok",
				title: "Apply",
			},
			{
				id: "save",
				title: "Save color",
			},
			{
				id: "cancel",
				title: "Cancel",
			},
		]);

		await joplin.settings.registerSection("settings.textColorize", {
			label: "Text Colorize",
			iconName: "fas fa-palette",
		});

		await joplin.settings.registerSettings({
			saved: {
				value: "",
				type: SettingItemType.String,
				section: "settings.textColorize",
				public: true,
				label: "Saved colors",
				description:
					"Saved colors for quick access. Use a semicolon (;) as a separator.",
			},

			shortcut: {
				value: "Ctrl+Shift+C",
				type: SettingItemType.String,
				section: "settings.textColorize",
				public: true,
				label: "Shortcut",
				description:
					'Shortcut for the Text Colorize menu, use "+" to combine the keys. You need to restart Joplin to apply the new shortcut.',
			},
		});

		await joplin.commands.register({
			name: "colorPick",
			label: "Text Colorize",
			execute: async () => {
				let selectedText = (await joplin.commands.execute(
					"selectedText"
				)) as string;

				const newlines = /\n/.test(selectedText);

				if (newlines) {
					selectedText = `\n\n${selectedText}\n\n`;
				}

				const savedColors = (await joplin.settings.value(
					"saved"
				)) as string;

				await dialogs.setHtml(
					dialog,
					generateHtml(savedColors.split(";"))
				);

				const res = await dialogs.open(dialog);
				const colorValue = res.formData.color_picker.hex_input;

				if (res.id === "save") {
					await joplin.settings.setValue(
						"saved",
						savedColors === ""
							? colorValue
							: `${savedColors};${colorValue}`
					);
				} else if (res.id === "ok") {
					await joplin.commands.execute(
						"replaceSelection",
						`<span style="color: ${colorValue}">${selectedText}</span>`
					);
				}
			},
		});

		const shortcut = (await joplin.settings.value("shortcut")) as string;

		await joplin.views.menus.create("text-colorize", "Text Colorize", [
			{
				commandName: "colorPick",
				accelerator: shortcut,
			},
		]);
	},
});

function generateHtml(savedColors) {
	let savedColorsHTML = 'Saved colors <div class="saved-colors">';
	savedColors.forEach((color) => {
		color = color.trim();

		savedColorsHTML += `<div value="${color}" class="saved-color" style="background-color: ${color}"></div>`;
	});
	savedColorsHTML += "</div>";

	return `<div class="container"> 
		<h2>Text Colorize</h2> 
		<form class="color-picker" name="color_picker">
			<div class="rgb-input">
				<div>
					<input type="range" min="0" max="255" value="127" id="r-range">
					<input type="text" min="0" max="255" value="127" id="r-input">
				</div>
				<div>
					<input type="range" min="0" max="255" value="127" id="g-range">
					<input type="text" min="0" max="255" value="127" id="g-input">
				</div>
				<div>
					<input type="range" min="0" max="255" value="127" id="b-range">
					<input type="text" min="0" max="255" value="127" id="b-input">
				</div>
			</div>
			<div class="preview-container">
				<div class="color-preview"></div>
				<input value="#7F7F7F" id="hex-input" name="hex_input">
			</div>
		</form>
		${savedColorsHTML}
	</div>`;
}
