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
				id: "apply-bg",
				title: "Apply as BG",
			},
			{
				id: "cancel",
				title: "Close",
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

			extShortcut: {
				value: "Ctrl+Shift+C",
				type: SettingItemType.String,
				section: "settings.textColorize",
				public: true,
				label: "Extension shortcut",
				description:
					'Shortcut for the Text Colorize menu, use "+" to combine the keys. You need to restart Joplin to apply the new shortcut.',
			},

			rcShortcut: {
				value: "Ctrl+Shift+R",
				type: SettingItemType.String,
				section: "settings.textColorize",
				public: true,
				label: "Restore color shortcut",
				description:
					'Shortcut to restore the original color of the selected text, use "+" to combine the keys. You need to restart Joplin to apply the new shortcut.',
			},
		});

		await joplin.commands.register({
			name: "colorPick",
			label: "Text Colorize",
			execute: async () => {
				const selectedText = await getSelectedText();

				const savedColors = (await joplin.settings.value(
					"saved"
				)) as string;

				await dialogs.setHtml(
					dialog,
					generateHtml(savedColors.split(";"))
				);

				const res = await dialogs.open(dialog);
				const colorValue = res.formData.color_picker.hex_input;
				const savedColorsChanges = JSON.parse(
					res.formData.color_picker.saved_colors_changes
				);

				let updatedSavedColors = savedColors.split(";");

				if (savedColorsChanges.add) {
					savedColorsChanges.add.forEach((color) => {
						updatedSavedColors.push(color);
					});
				}

				if (savedColorsChanges.remove) {
					savedColorsChanges.remove.forEach((color) => {
						updatedSavedColors.splice(
							updatedSavedColors.indexOf(color),
							1
						);
					});
				}

				await joplin.settings.setValue(
					"saved",
					updatedSavedColors.join(";")
				);

				if (res.id === "ok") {
					await joplin.commands.execute(
						"replaceSelection",
						`<span style="color: ${colorValue}">${selectedText}</span>`
					);
				} else if (res.id === "apply-bg") {
					await joplin.commands.execute(
						"replaceSelection",
						`<span style="background-color: ${colorValue}">${selectedText}</span>`
					);
				}
			},
		});

		await joplin.commands.register({
			name: "restoreColor",
			label: "Restore Color",
			execute: async () => {
				const selectedText = await getSelectedText();
				let textBetweenTags = selectedText.match(
					/<span style="color: (.*)">(.*)<\/span>/
				);

				if (textBetweenTags) {
					await joplin.commands.execute(
						"replaceSelection",
						`${textBetweenTags[2]}`
					);
				}
			},
		});

		const extShortcut = (await joplin.settings.value(
			"extShortcut"
		)) as string;
		const rcShortcut = (await joplin.settings.value(
			"rcShortcut"
		)) as string;

		await joplin.views.menus.create("text-colorize", "Text Colorize", [
			{
				commandName: "colorPick",
				accelerator: extShortcut,
			},

			{
				commandName: "restoreColor",
				accelerator: rcShortcut,
			},
		]);
	},
});

function generateHtml(savedColors) {
	let savedColorsHTML = 'Saved colors <div class="saved-colors">';
	savedColors.forEach((color) => {
		color = color.trim();

		savedColorsHTML += `<button value="${color}" class="saved-color" style="background-color: ${color}"></button>`;
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
				<button class="save-color">Save this color</button>
			</div>
			<input class="saved-colors-changes" name="saved_colors_changes" value="{}">
		</form>
		${savedColorsHTML}
		<div class="remove-colors-text">Right click a color to remove it.</div>
	</div>`;
}

async function getSelectedText() {
	let selectedText = (await joplin.commands.execute(
		"selectedText"
	)) as string;

	const newlines = /\n/.test(selectedText);

	if (newlines) {
		selectedText = `\n\n${selectedText}\n\n`;
	}

	return selectedText;
}
