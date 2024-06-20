<script lang="ts">
  import { MarkdownRenderer } from 'obsidian'
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import ChatMessage from './ChatMessage.svelte'

  const dispatch = createEventDispatcher()

  export let plugin
  export let threadConversation

  let newMessageElement
  let messagesElement
  let currentNewMessage = ''
  let messages = []
  let fileCount = null

  const scrollBottomAffinityInterval = 100 // milliseconds

  onMount(async () => {
    newMessageElement.focus()

    await threadConversation.init()

    await countFiles()
  })

  async function countFiles() {
    const vectorStoreFiles = await plugin.syncFiles.listVectorStoreFiles()

    fileCount = vectorStoreFiles.data.length
  }

  const countFilesInterval = setInterval(countFiles, 10000)

  onDestroy(() => {
    clearInterval(countFilesInterval)
  })

  async function addNewMessage(message) {
    messages = [...messages, { raw: message, type: 'user' } ]

    await threadConversation.addMessage(message)

    currentNewMessage = ''

    const scrollInterval = setInterval(() => {
      messagesElement.scrollTop = messagesElement.scrollHeight
    }, scrollBottomAffinityInterval)

    try {
      for await (const e of threadConversation.runStream()) {
        console.info(e)

        if (e.event === 'thread.run.created') {
          messages = [...messages, {
            type: 'assistant',
            status: 'queued',
            raw: '',
            html: '...'
          }]
        }

        if (e.event.startsWith('thread.message.') && e.event !== 'thread.message.completed') {
          const content = e.data?.content || e.data?.delta?.content || []

          const additionalRawContent = content.reduce((acc, content) => {
            return acc + content.text.value
          }, '')

          const messageToMutate = messages.pop()

          messageToMutate.raw = messageToMutate.raw + additionalRawContent
          messageToMutate.html = await convertMarkdownToHtml(messageToMutate.raw)

          messages = [...messages, messageToMutate]
        }
      }
    } finally {
      clearInterval(scrollInterval)
    }
  }

  function handleNewMessageKeydown(event) {
    if (event.key === "Enter") {
      addNewMessage(currentNewMessage)
      event.preventDefault()
    }
  }

  function handleNewMessageClick(event) {
    addNewMessage(currentNewMessage)
  }

  function handleClearMessages(event) {
    messages = []

    dispatch('clear')
  }

  async function handleSyncFiles(event) {
    fileCount = null

    plugin.app.commands.executeCommandById('openai-assistant:sync-files')
  }

  async function convertMarkdownToHtml(markdownText) {
    const container = window.document.createElement('div');

    await MarkdownRenderer.renderMarkdown(markdownText, container, '', plugin);

    return container.innerHTML;
  }
</script>

<div class="root">
  <header>
    <div class="info">
      {#if fileCount !== null}
        <span>{fileCount} Files</span>
      {:else}
        <span>Counting files...</span>
      {/if}
    </div>

    <div class="button" role="button" aria-label="Sync files" data-tooltip-position="left" data-tooltip-delay="300" tabindex="0" on:click={handleSyncFiles} on:keydown={handleSyncFiles}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Pro 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M352 222.7c0 18.4 14.9 33.3 33.3 33.3c8.4 0 16.4-3.1 22.6-8.8l99-91.4c3.3-3 5.1-7.3 5.1-11.8s-1.9-8.7-5.1-11.8l-99-91.4c-6.1-5.7-14.2-8.8-22.6-8.8C366.9 32 352 46.9 352 65.3V128H16c-8.8 0-16 7.2-16 16s7.2 16 16 16H352v62.7zm33.3 1.3c-.7 0-1.3-.6-1.3-1.3V65.3c0-.7 .6-1.3 1.3-1.3c.3 0 .6 .1 .9 .3L472.4 144l-86.3 79.7c-.2 .2-.5 .3-.9 .3zM126.7 480c18.4 0 33.3-14.9 33.3-33.3V384H496c8.8 0 16-7.2 16-16s-7.2-16-16-16H160V289.3c0-18.4-14.9-33.3-33.3-33.3c-8.4 0-16.4 3.1-22.6 8.8l-99 91.4C1.9 359.3 0 363.5 0 368s1.9 8.7 5.1 11.8l99 91.4c6.1 5.7 14.2 8.8 22.6 8.8zm1.3-33.3c0 .7-.6 1.3-1.3 1.3c-.3 0-.6-.1-.9-.3L39.6 368l86.3-79.7c.2-.2 .5-.3 .9-.3c.7 0 1.3 .6 1.3 1.3V446.7z"/></svg>
    </div>

    <div class="button" role="button" aria-label="Clear messages" data-tooltip-position="left" data-tooltip-delay="300" tabindex="0" on:click={handleClearMessages} on:keydown={handleClearMessages}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Pro 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M164.2 39.5L148.9 64H267.1L251.8 39.5c-2.9-4.7-8.1-7.5-13.6-7.5H177.7c-5.5 0-10.6 2.8-13.6 7.5zM279 22.6L304.9 64h47.1H384h16c8.8 0 16 7.2 16 16s-7.2 16-16 16H381.7L356.2 452.6C353.9 486.1 326 512 292.4 512H123.6c-33.6 0-61.4-25.9-63.8-59.4L34.3 96H16C7.2 96 0 88.8 0 80s7.2-16 16-16H32 64.1h47.1L137 22.6C145.8 8.5 161.2 0 177.7 0h60.5c16.6 0 31.9 8.5 40.7 22.6zM66.4 96L91.7 450.3C92.9 467 106.8 480 123.6 480H292.4c16.8 0 30.7-13 31.9-29.7L349.6 96H66.4zM464 128H624c8.8 0 16 7.2 16 16s-7.2 16-16 16H464c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 128H592c8.8 0 16 7.2 16 16s-7.2 16-16 16H464c-8.8 0-16-7.2-16-16s7.2-16 16-16zM448 400c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H464c-8.8 0-16-7.2-16-16z"/></svg>
    </div>
  </header>

  <div bind:this={messagesElement} class="messages">
    {#each messages as message}
      <ChatMessage message={message} />
    {/each}
  </div>

  <div class="footer">
    <div
      class="new-message"
      role="textbox"
      tabindex="0"
      contenteditable="true"
      bind:innerText={currentNewMessage}
      bind:this={newMessageElement}
      on:keydown={handleNewMessageKeydown}
    ></div>
    <!-- eslint-disable-next-line svelte/valid-compile -->
    <div class="send-message" tabindex="0" role="button" on:click={handleNewMessageClick} on:keydown={handleNewMessageClick} aria-label="Send" data-tooltip-position="top" data-tooltip-delay="500">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Pro 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16h32v48.6C123.8 152.8 32 249.7 32 368v16H64V368c0-106 86-192 192-192s192 86 192 192v16h32V368c0-118.3-91.8-215.2-208-223.4V96h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H256 208zM16 416c-8.8 0-16 7.2-16 16s7.2 16 16 16H496c8.8 0 16-7.2 16-16s-7.2-16-16-16H16z"/></svg>
    </div>
  </div>
</div>

<style>
  .root {
    height: 100%;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      'header'
      'main'
      'footer';
  }

  header {
    grid-area: header;
    display: flex;
    align-items: center;
    padding-bottom: var(--size-4-3);
    margin-bottom: var(--size-4-3);
    border-bottom: var(--border-width) solid var(--divider-color);
  }

  header .info {
    width: 100%;
    flex-grow: 1;
    color: var(--text-faint);
  }

  header .button {
    padding: var(--size-4-1) var(--size-4-2);
    margin-left: var(--size-4-1);
    font-weight: var(--input-font-weight);
    cursor: var(--cursor);
    border: 0;
    font-size: var(--font-ui-small);
    border-radius: var(--button-radius);
    font-family: inherit;
    outline: none;
    user-select: none;
    white-space: nowrap;
    display: grid;
    align-items: center;
  }

  header .button:hover {
    background-color: var(--interactive-normal);
  }

  header .button svg {
    height: var(--icon-m);
    fill: currentColor;
  }

  .messages {
    grid-area: main;
    overflow: auto;
  }

  .footer {
    grid-area: footer;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-column-gap: var(--size-4-3);
    padding-top: var(--size-4-3);
  }

  .new-message {
    padding: var(--size-4-3);
    border-style: solid;
    border-width: var(--input-border-width);
    border-radius: var(--input-radius);
    border-color: var(--background-modifier-border);
    background-color: var(--background-primary);
    overflow: hidden;
  }

  .new-message:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--background-modifier-border-hover);
  }

  .new-message:focus {
    border-color: var(--background-modifier-border-focus);
  }

  .send-message {
    padding: var(--size-4-3);
    background-color: var(--interactive-normal);
    box-shadow: var(--input-shadow);
    font-weight: var(--input-font-weight);
    cursor: var(--cursor);
    border: 0;
    font-size: var(--font-ui-small);
    border-radius: var(--button-radius);
    font-family: inherit;
    outline: none;
    user-select: none;
    white-space: nowrap;
    display: grid;
    align-items: center;
  }

  .send-message:hover {
    background-color: var(--interactive-hover);
    box-shadow: var(--input-shadow-hover);
  }

  .send-message svg {
    height: var(--icon-m);
    fill: currentColor;
  }
</style>
