import { SyncFiles } from 'src/sync'
import { Plugin, Vault, TFile } from 'obsidian'

interface RegisterFileSyncToVaultOptions {
  plugin: Plugin,
  vault: Vault,
  syncFiles: SyncFiles
}

export function registerFileSyncToVault ({ plugin, vault, syncFiles }: RegisterFileSyncToVaultOptions) {
  plugin.registerEvent(
    vault.on('create', async (file: TFile) => {
      if (file.extension === 'md') {
        const contents = await vault.cachedRead(file)
        const vaultFile = { path: file.path, contents }

        await syncFiles.addRemoteFile(vaultFile)

        console.info(`Added new file ${file.path}`)
      }
    })
  )

  plugin.registerEvent(
    vault.on('modify', async (file: TFile) => {
      if (file.extension === 'md') {
        await syncFiles.deleteRemoteFile(file.path)

        const contents = await vault.cachedRead(file)
        const vaultFile = { path: file.path, contents }

        await syncFiles.addRemoteFile(vaultFile)

        console.info(`Added new file ${file.path}`)
      }
    })
  )

  plugin.registerEvent(
    vault.on('delete', async (file: TFile) => {
      if (file.extension === 'md') {
        await syncFiles.deleteRemoteFile(file.path)

        console.info(`Remote file deleted ${file.path}`)
      }
    })
  )

  plugin.registerEvent(
    vault.on('rename', async (file: TFile, oldPath) => {
      if (file.extension === 'md') {
        await syncFiles.deleteRemoteFile(oldPath)

        console.info(`Remote file (old path) deleted ${oldPath}`)

        const contents = await vault.cachedRead(file)
        const vaultFile = { path: file.path, contents }

        await syncFiles.addRemoteFile(vaultFile)

        console.info(`Added new file ${file.path}`)
      }
    })
  )
}
