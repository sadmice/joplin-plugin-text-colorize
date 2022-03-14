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

				let savedColorsHTML =
					'Saved colors: <div class="saved-colors">';
				savedColors.split(";").forEach((color) => {
					color = color.trim();

					savedColorsHTML += `<div value="${color}" class="saved-color" style="background-color: ${color}"></div>`;
				});
				savedColorsHTML += "</div>";

				await dialogs.setHtml(
					dialog,
					`<div class="container"> 
						<h2>Text Colorize</h2> 
						<form class="color-picker" name="color_picker">
							<input placeholder="#ffffff" class="color-input" name="color_input">
							<div class="color-preview"></div>
						</form>
						${savedColorsHTML}
					</div>`
				);

				const res = await dialogs.open(dialog);
				const colorValue = res.formData.color_picker.color_input;

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
