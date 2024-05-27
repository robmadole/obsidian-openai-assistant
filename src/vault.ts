import { Vault } from 'obsidian'

export interface VaultFile {
  path: string,
  contents: string
}

export interface VaultProvider {
  vault: Vault | VaultFile[]

  addFile(file: VaultFile): Promise<boolean>

  markdownFiles(): Promise<Array<VaultFile>>
}

export class VaultReader implements VaultProvider {
  vault: Vault

  constructor (obsidianVault: Vault) {
    this.vault = obsidianVault
  }

  async addFile (file: VaultFile) {
    return false
  }

  async markdownFiles () {
    const vaultFiles = []

    for (const markdownFile of this.vault.getMarkdownFiles()) {
      const contents = await this.vault.cachedRead(markdownFile)

      if (contents.length > 0) {
        vaultFiles.push({ path: markdownFile.path, contents })
      }
    }

    return vaultFiles
  }
}
