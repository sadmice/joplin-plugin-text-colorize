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

			rtShortcut: {
				value: "Ctrl+Shift+R",
				type: SettingItemType.String,
				section: "settings.textColorize",
				public: true,
				label: "Restore text shortcut",
				description:
					'Shortcut to restore the original color of the selected text, use "+" to combine the keys. You need to restart Joplin to apply the new shortcut.',
			},
		});

		await joplin.commands.register({
			name: "colorize",
			label: "Text Colorize",
			execute: async () => {
				const selections = await joplin.commands.execute(
					"editor.execCommand",
					{ name: "getSelections", args: [] }
				);

				const savedColors = (await joplin.settings.value(
					"saved"
				)) as string;

				await dialogs.setHtml(
					dialog,
					generateHtml(savedColors.split(";"))
				);

				const res = await dialogs.open(dialog);
				const color = res.formData.color_picker.hex_input;
				const savedColorsChanges = JSON.parse(
					res.formData.color_picker.saved_colors_changes
				);

				if (savedColorsChanges.add || savedColorsChanges.remove) {
					updateSavedColors(savedColors, savedColorsChanges);
				}

				if (res.id === "ok") {
					colorize(selections, color, "color");
				} else if (res.id === "apply-bg") {
					colorize(selections, color, "background-color");
				}
			},
		});

		await joplin.commands.register({
			name: "restoreText",
			label: "Restore Text",
			execute: async () => {
				const selections = await joplin.commands.execute(
					"editor.execCommand",
					{ name: "getSelections", args: [] }
				);

				console.log(selections);

				const restoredSelections = selections.map((selection) => {
					const textBetweenTags = selection.match(
						/<span style="(?:color||background-color): (?:.{4}"|.{7}")>(.*)<\/span>/
					);

					console.log(textBetweenTags);

					return textBetweenTags ? textBetweenTags[1] : selection;
				});

				console.log(restoredSelections);

				await joplin.commands.execute("editor.execCommand", {
					name: "replaceSelections",
					args: [restoredSelections],
				});
			},
		});

		const extShortcut = (await joplin.settings.value(
			"extShortcut"
		)) as string;

		const rtShortcut = (await joplin.settings.value(
			"rtShortcut"
		)) as string;

		await joplin.views.menus.create("text-colorize", "Text Colorize", [
			{
				commandName: "colorize",
				accelerator: extShortcut,
			},

			{
				commandName: "restoreText",
				accelerator: rtShortcut,
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

async function colorize(selections, color, type) {
	const colorizedSelections = selections.map(
		(selection) => `<span style="${type}: ${color}">${selection}</span>`
	);

	await joplin.commands.execute("editor.execCommand", {
		name: "replaceSelections",
		args: [colorizedSelections, "around"],
	});
	await joplin.commands.execute('editor.focus');
}

async function updateSavedColors(savedColors, changes) {
	let updatedSavedColors = savedColors.split(";");

	if (changes.add) {
		changes.add.forEach((color) => {
			updatedSavedColors.push(color);
		});
	}

	if (changes.remove) {
		changes.remove.forEach((color) => {
			updatedSavedColors.splice(updatedSavedColors.indexOf(color), 1);
		});
	}

	await joplin.settings.setValue("saved", updatedSavedColors.join(";"));
}
