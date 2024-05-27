import OpenAI from 'openai'
import { SyncFiles } from 'src/sync'
import { VaultReader } from 'src/vault'
import { App, Plugin, Modal, PluginSettingTab, Setting } from 'obsidian'
import ProcessingFilesModal from 'src/components/ProcessingFilesModal.svelte'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface PluginSettings {
	openAiApiKey: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	openAiApiKey: ''
}

export class LoadingModal extends Modal {
  component: ProcessingFilesModal

  constructor(app: App) {
    super(app);
  }

  onOpen() {
    this.component = new ProcessingFilesModal({
      target: this.contentEl,
      props: {
        heading: 'Syncing files',
        filename: null
      }
    });
  }

  onClose() {
    this.component.$destroy()
  }

  nowProcessing(filename) {
    this.component.$set({ filename: filename })
  }
}

export default class AssistantPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

    const openai = new OpenAI({ apiKey: this.settings.openAiApiKey, dangerouslyAllowBrowser: true })
    const vaultReader = new VaultReader(this.app.vault)

    const syncFiles = new SyncFiles({ openai, vaultReader })

    const loadingModal = new LoadingModal(this.app)

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: 'sync-files',
      name: 'Sync Files',
      callback: async () => {
        try {
          loadingModal.open()

          for await (const file of syncFiles.sync()) {
            loadingModal.nowProcessing(file.path)
          }
        } finally {
          loadingModal.close()
        }
      }
    })

    this.addCommand({
      id: 'delete-files',
      name: 'Delete Files',
      callback: () => {
        syncFiles.deleteRemoteFiles()
      }
    })

    // this.app.vault.on('create',
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
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
