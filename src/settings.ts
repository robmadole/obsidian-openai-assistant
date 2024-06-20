import { App, PluginSettingTab, Setting } from 'obsidian'
import AssistantPlugin from 'main'

export interface PluginSettings {
	openAiApiKey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	openAiApiKey: ''
}

export class SettingsTab extends PluginSettingTab {
	plugin: AssistantPlugin;

	constructor(app: App, plugin: AssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Open AI API Key')
			.setDesc('Go to https://platform.openai.com to create a new API key.')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.openAiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openAiApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
