<script lang="ts">
  import { Message } from 'src/openai'

  export let message : Message
</script>

{#if message.type === 'user'}
  <div class="message user">
    <span class="message-type">User</span>
    {message.raw}
  </div>
{/if}

{#if message.type === 'assistant'}
  <div class="message assistant">
    <span class="message-type">Assistant</span>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html message.html}
  </div>
{/if}

<style>
  .message {
    width: calc(100% - var(--size-4-4));
    margin-bottom: var(--size-4-3);
    overflow: scroll;
    background-color: var(--background-primary);
    border-style: solid;
    border-width: var(--input-border-width);
    border-radius: var(--input-radius);
    border-color: var(--background-modifier-border);
    user-select: text;
  }

  .message.user {
    margin-left: var(--size-4-4);
  }

  .message.assistant {
    margin-right: var(--size-4-4);
  }

  .message-type {
    display: block;
    color: var(--text-faint);
    margin-bottom: var(--size-4-2);
    font-size: var(--font-smallest);
    font-weight: var(--font-light);
  }
</style>
