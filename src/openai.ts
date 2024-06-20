import AssistantPlugin from 'main'
import type { Thread } from 'openai/resources/beta/threads'
import type { Assistant } from 'openai/resources/beta/assistants'
import { VectorStore } from 'openai/resources/beta/vector-stores'

export interface Message {
  type: 'user' | 'assistant',
  status?: 'queued',
  raw?: string,
  html?: string
}

export class ThreadConversation {
  plugin: AssistantPlugin
  thread: Thread
  assistant: Assistant

  constructor (plugin: AssistantPlugin) {
    this.plugin = plugin
  }

  async init () {
    const syncFiles = this.plugin.syncFiles
    const openai = this.plugin.openai

    this.assistant = await syncFiles.getOrCreateAssistant(this.plugin.syncFiles.vectorStore as VectorStore)

    this.thread = await openai.beta.threads.create()
  }

  async addMessage (content: string) {
    await this.plugin.openai.beta.threads.messages.create(
      this.thread.id,
      {
        role: "user",
        content
      }
    )
  }

  async* runStream () {
    const stream =
      this.plugin.openai.beta.threads.runs.stream(this.thread.id, {
        assistant_id: this.assistant.id,
        instructions: 'Please answer in only markdown-formatted text.'
      })

    for await (const event of stream) {
      yield event
    }
  }
}
