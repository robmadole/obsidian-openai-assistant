import { App, Modal } from 'obsidian'
import ListFilesComponent from 'src/components/ListFiles.svelte'

export class FileStatusModal extends Modal {
  component: ListFilesComponent
  heading: string
  count: number

  constructor(app: App, heading: string) {
    super(app);

    this.heading = heading
    this.count = 0
  }

  onOpen() {
    this.component = new ListFilesComponent({
      target: this.contentEl,
      props: {
        heading: this.heading,
        filename: null,
        count: this.count
      }
    });
  }

  onClose() {
    this.component.$destroy()
  }

  nowProcessing(filename: string) {
    this.count = this.count + 1

    this.component.$set({ filename, count: this.count })
  }
}
