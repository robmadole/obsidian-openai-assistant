import { expect } from 'vitest'
import { it } from './test-context'

it('list files', async ({ syncFiles }) => {
  expect(await syncFiles.listRemoteFiles()).toEqual([])
})

it('add file', async ({ syncFiles }) => {
  const vaultFile = {path: 'Test.md', contents: 'Test files'}

  expect(await syncFiles.addRemoteFile(vaultFile)).toBeTruthy()
})

it('delete file', async ({ syncFiles, sleep }) => {
  const vaultFile = {path: 'Test.md', contents: 'Test files'}

  await syncFiles.addRemoteFile(vaultFile)

  await sleep(1000)

  await syncFiles.deleteRemoteFile('Test.md')

  expect((await syncFiles.listRemoteFiles()).length).toEqual(0)
})

it('sync files', { timeout: 5000 }, async ({ syncFiles, sleep }) => {
  syncFiles.vaultReader.addFile(
    {path: 'Test.md', contents: 'Test files'}
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _f of syncFiles.sync()) {
    // noop
  }

  await sleep(1000)

  const vsf = await syncFiles.listVectorStoreFiles()

  expect(vsf.data.length).toEqual(1)
})
