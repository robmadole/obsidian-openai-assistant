import { open } from 'fs/promises'
import { Plugin } from 'obsidian'
import { FileStatusModal } from 'src/modals/FileStatusModal'
import { sleep } from 'src/timers'

interface PlayOptions {
  plugin: Plugin
}

export async function play ({ plugin }: PlayOptions) {
  // openAIThread(plugin)
}

async function fileStatusModal (plugin) {
  const component = new FileStatusModal(plugin.app, 'Test Heading')

  await sleep(1000)

  component.open()

  component.nowProcessing('This/File name.md')

  await sleep(1000)

  component.nowProcessing('This/File name/That is really long/And nested deep down.md')

  await sleep(1000)

  component.close()
}
