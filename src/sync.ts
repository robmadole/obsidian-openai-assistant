import { OpenAI, toFile } from 'openai'
import { FileObjectsPage, FileObject } from 'openai/resources/files'
import { Assistant } from 'openai/resources/beta/assistants'
import { VectorStore } from 'openai/resources/beta/vector-stores'
import { VectorStoreFileBatch } from 'openai/resources/beta/vector-stores/file-batches'
import { VaultProvider, VaultFile } from './vault'

const VECTOR_STORE_NAME = 'Obsidian OpenAI Assistant'
const ASSISTANT_NAME = 'Obsidian OpenAI Assistant'

export interface SyncFilesOptions {
  openai: OpenAI,
  vaultReader: VaultProvider,
  addToVectorStoreInterval?: number
}

export class SyncFiles {
  openai: OpenAI
  vectorStore: VectorStore | null
  assistant: Assistant | null
  vectorStorePopulationStatus: 'idle' | 'running'
  vaultReader: VaultProvider
  addedFiles: Array<FileObject>
  addToVectorStoreWatcher: ReturnType<typeof setInterval>

  constructor (options: SyncFilesOptions) {
    this.openai = options.openai
    this.vaultReader = options.vaultReader
    this.addedFiles = []
    this.vectorStore = null
    this.assistant = null
    this.vectorStorePopulationStatus = 'idle'
    this.initVectorStore(options.addToVectorStoreInterval || 10)
  }

  async initVectorStore (interval: number) : Promise<void> {
    this.vectorStore = await this.getOrCreateVectorStore()

    if (this.vectorStore) {
      this.getOrCreateAssistant(this.vectorStore)
    }

    this.addToVectorStoreWatcher = setInterval(async () => {
      if (this.vectorStorePopulationStatus !== 'idle') {
        return
      }

      if (this.addedFiles.length > 0) {
        this.vectorStorePopulationStatus = 'running'

        try {
          await this.addAnyFilesToVectorStore(this.addedFiles)
        } finally {
          this.addedFiles.length = 0
          this.vectorStorePopulationStatus = 'idle'
        }
      }
    }, interval)
  }

  shutdown () : void {
    clearInterval(this.addToVectorStoreWatcher)
  }

  async *sync() {
    const vaultFiles = await this.vaultReader.markdownFiles()
    const remoteFiles = await this.listRemoteFiles()

    for (const index in vaultFiles) {
      const vaultFile = vaultFiles[index]
      const remoteFile = remoteFiles.find((file: FileObject) => file.filename === vaultFile.path)

      if (!remoteFile) {
        await this.addRemoteFile(vaultFile)

        yield vaultFile
      }
    }
  }

  async getOrCreateVectorStore() {
    let vectorStore = null

    const vectorStores = await this.openai.beta.vectorStores.list()

    for await (const vectorStorePage of vectorStores.iterPages()) {
      if (vectorStore) break

      // @ts-ignore
      vectorStore = vectorStorePage.data.find((vc: VectorStore) => {
        return vc.name === VECTOR_STORE_NAME
      })
    }

    if (!vectorStore) {
      vectorStore = await this.openai.beta.vectorStores.create({
        name: VECTOR_STORE_NAME
      });
    }

    return vectorStore
  }

  async getOrCreateAssistant(vectorStore: VectorStore) {
    let assistant = null

    const assistants = await this.openai.beta.assistants.list()

    for await (const assistantsPage of assistants.iterPages()) {
      if (assistant) break

      // @ts-ignore
      assistant = assistantsPage.data.find((a: Assistant) => {
        return a.name === ASSISTANT_NAME
      })
    }

    if (!assistant) {
      assistant = await this.openai.beta.assistants.create({
        name: ASSISTANT_NAME,
        tools: [{ type: 'file_search' }],
        model: 'gpt-4o'
      });
    }

    return assistant
  }

  async deleteVectorStore() {
    if (this.vectorStore) {
      await this.openai.beta.vectorStores.del(this.vectorStore.id)

      this.vectorStore = null
    }
  }

  async deleteAssistant() {
    if (this.assistant) {
      await this.openai.beta.assistants.del(this.assistant.id)

      this.assistant = null
    }
  }

  async addAnyFilesToVectorStore (addedFiles: FileObject[]) : Promise<VectorStoreFileBatch> {
    const fileIds: Array<string> = addedFiles.reduce((acc, file) => {
      if (!file) {
        return acc
      }

      // @ts-ignore
      acc.push(file.id)

      return acc
    }, [])

    if (this.vectorStore) {
      return this.openai.beta.vectorStores.fileBatches.create(
        this.vectorStore.id,
        { file_ids: fileIds }
      )
    } else {
      throw new Error('Vector store has not been initialized')
    }
  }

  async listVectorStoreFiles () {
    if (this.vectorStore) {
      return this.openai.beta.vectorStores.files.list(
        this.vectorStore.id
      )
    } else {
      throw new Error('Vector store has not been initialized')
    }
  }

  async addRemoteFile (vaultFile: VaultFile): Promise<FileObject | null> {
    const contents = vaultFile.contents

    if (contents.length === 0) {
      return null
    }

    const addedFile: FileObject = await this.openai.files.create({
      file: await toFile(Buffer.from(contents, 'utf-8'), vaultFile.path),
      purpose: "assistants",
    });

    this.addedFiles.push(addedFile)

    return addedFile
  }

  async listRemoteFiles (): Promise<FileObject[]> {
    const files: Array<FileObject> = []

    const fileObjectsPage: FileObjectsPage = await this.openai.files.list({ purpose: 'assistants' })

    for await (const page of fileObjectsPage.iterPages()) {
      // @ts-ignore
      files.push(...page.data)
    }

    return files
  }

  async deleteRemoteFile (filename: string): Promise<boolean> {
    const files = await this.listRemoteFiles()

    for (const file of files) {
      if (file.filename === filename) {
        await this.openai.files.del(file.id)
      }
    }

    return true
  }

  async deleteRemoteFiles (): Promise<boolean> {
    const files = await this.listRemoteFiles()

    for (const file of files) {
      await this.openai.files.del(file.id)
    }

    return true
  }
}
