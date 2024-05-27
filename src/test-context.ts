import { OpenAI } from 'openai'
import { test } from 'vitest'
import { VaultProvider, VaultFile } from './vault'
import { SyncFiles } from './sync'

const API_KEY = process.env['TEST_PROJECT_OPENAI_API_KEY']

if (!API_KEY) {
  throw new Error('Missing TEST_PROJECT_OPENAI_API_KEY')
}

const client = new OpenAI({ apiKey: API_KEY, dangerouslyAllowBrowser: true })

interface Fixtures {
  openai: OpenAI,
  sleep: (ms: number) => Promise<ReturnType<typeof setTimeout>>,
  syncFiles: SyncFiles
}

export const it = test.extend<Fixtures>({
  openai: async ({}, use) => {
    await use(client)
  },

  sleep: async ({}, use) => {
    const fn = (ms: number) => new Promise<ReturnType<typeof setTimeout>>((r) => setTimeout(r, ms))

    use(fn)
  },

  syncFiles: async ({}, use) => {
    const vaultReader = new TestVaultReader([])
    const syncFiles = new SyncFiles({ openai: client, vaultReader })

    await use(syncFiles)

    await syncFiles.deleteRemoteFiles()
    await syncFiles.deleteVectorStore()
    await syncFiles.deleteAssistant()

    syncFiles.shutdown()
  }
})

class TestVaultReader implements VaultProvider {
  vault: VaultFile[]

  constructor(files: VaultFile[]) {
    this.vault = files
  }

  async addFile(file: VaultFile) {
    this.vault.push(file)

    return true
  }

  async markdownFiles() {
    return this.vault
  }
}
