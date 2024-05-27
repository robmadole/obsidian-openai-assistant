<script lang="ts">
  export let heading: string;
  export let filename: string;
</script>

<div>
  <div class="heading">{heading}</div>
  {#if filename}
    <span class="filename">{filename}</span>
  {:else}
    <span class="filename">Fetching data from OpenAI...</span>
  {/if}
</div>

<style>
  .heading {
    margin-bottom: var(--size-4-3);
  }

  .filename {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
</style>
