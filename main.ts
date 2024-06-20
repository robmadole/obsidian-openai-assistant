import OpenAI from 'openai'
import { SyncFiles } from 'src/sync'
import { VaultReader } from 'src/vault'
import { Plugin, WorkspaceLeaf } from 'obsidian'
import type { PluginSettings }  from 'src/settings'
import { SettingsTab, DEFAULT_SETTINGS } from 'src/settings'
import { FileStatusModal } from 'src/modals/FileStatusModal'
import { ChatView, VIEW_TYPE_CHATVIEW } from 'src/views/ChatView'
import { registerFileSyncToVault } from 'src/events/file-sync'

import 'src/icons'

export default class AssistantPlugin extends Plugin {
	settings: PluginSettings;

  openai: OpenAI;

  syncFiles: SyncFiles;

	async onload() {
		await this.loadSettings();

    this.registerView(
      VIEW_TYPE_CHATVIEW,
      (leaf) => new ChatView(leaf, this)
    )

    this.addRibbonIcon('obsidian-openai-plugin-fa-brain', 'OpenAI Assistant', () => {
      this.activateChatView();
    });

    this.openai = new OpenAI({ apiKey: this.settings.openAiApiKey, dangerouslyAllowBrowser: true })

    this.syncFiles = new SyncFiles({
      openai: this.openai,
      vaultReader: new VaultReader(this.app.vault),
      addToVectorStoreInterval: 5000
    })

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));

    this.addPluginCommands()

    this.app.workspace.onLayoutReady(() => {
      // Since this is listening to the "create" event, we wait until the onLayoutReady()
      // so that every file added to the vault doesn't trigger an upload to OpenAI's API
      registerFileSyncToVault({ plugin: this, vault: this.app.vault, syncFiles: this.syncFiles })
    })
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

  async activateChatView() {
    const { workspace } = this.app

    let leaf: WorkspaceLeaf | null

    const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHATVIEW)

    if (leaves.length > 0) {
      leaf = leaves[0]
    } else {
      leaf = workspace.getLeaf()
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_CHATVIEW, active: true })
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf)
    }
  }

  addPluginCommands() {
    this.addCommand({
      id: 'sync-files',
      name: 'Sync Files',
      callback: async () => {
        const statusModal = new FileStatusModal(this.app, 'Syncing files')

        try {
          statusModal.open()

          for await (const filename of this.syncFiles.sync()) {
            console.info(`File synced: ${filename}`)

            statusModal.nowProcessing(filename)
          }
        } finally {
          statusModal.close()
        }
      }
    })

    this.addCommand({
      id: 'delete-files',
      name: 'Delete Files',
      callback: async () => {
        const statusModal = new FileStatusModal(this.app, 'Deleting files')

        try {
          statusModal.open()

          for await (const filename of this.syncFiles.deleteRemoteFiles()) {
            console.info(`File deleted: ${filename}`)

            statusModal.nowProcessing(filename)
          }
        } finally {
          statusModal.close()
        }
      }
    })
  }
}
