import AssistantPlugin from 'main'
import { ItemView, WorkspaceLeaf } from 'obsidian'
import { ThreadConversation } from 'src/openai'
import Chat from 'src/components/Chat.svelte'

export const VIEW_TYPE_CHATVIEW = "obsidian-openai-chatview"

export class ChatView extends ItemView {
  component: Chat
  plugin: AssistantPlugin
  threadConversation: ThreadConversation

  constructor(leaf: WorkspaceLeaf, plugin: AssistantPlugin) {
    super(leaf);

    this.plugin = plugin

    this.threadConversation = new ThreadConversation(plugin)
  }

  getViewType() {
    return VIEW_TYPE_CHATVIEW;
  }

  getIcon() {
    return 'obsidian-openai-plugin-fa-brain'
  }

  getDisplayText() {
    return "OpenAI Assistant";
  }

  async onOpen() {
    this.component = new Chat({
      target: this.contentEl,
      props: {
        plugin: this.plugin,
        threadConversation: this.threadConversation
      }
    });

    this.component.$on('clear', async () => {
      this.threadConversation = new ThreadConversation(this.plugin)

      await this.threadConversation.init()

      this.component.$set({ threadConversation: this.threadConversation })
    })
  }

  async onClose() {
    this.component.$destroy()
  }
}
