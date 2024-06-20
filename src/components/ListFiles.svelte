<script lang="ts">
  export let heading: string;
  export let filename: string;
  export let count: number;
</script>

<div class="root">
  <div class="heading">{heading}</div>
  <div class="file-list">
    {#if filename}
      <div class="count">{count}</div><div class="filename">{filename}</div>
    {:else}
      <div class="filename">Fetching data from OpenAI...</div>
    {/if}
  </div>
</div>

<style>
  .root {
    background-color: var(--modal-background);
  }

  .heading {
    font: var(--font-interface);
    font-weight: var(--font-bold);
    margin-bottom: var(--size-4-3);
  }

  .file-list {
    padding: var(--size-4-2);
    background-color: var(--background-primary-alt);
    align-items: baseline;
    display: flex;
    justify-content: space-between;
    border-radius: var(--border-s);
  }

  .count, .filename {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-muted);
  }

  .count {
    min-width: 5em;
    text-align: right;
    padding-right: var(--size-4-2);
    font-size: var(--font-ui-smaller);
  }

  .filename {
    text-align: left;
    width: 100%;
    font-size: var(--font-ui-small);
  }
</style>
