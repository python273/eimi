<script>
let { open = false, children, summary, class: className = '', ...restProps } = $props()
let isOpen = $state(open)

function toggle() {
  isOpen = !isOpen
}
</script>

<button class="summary {className}" onclick={toggle} aria-expanded={isOpen} type="button" {...restProps}>
  <span class="indicator" class:open={isOpen}></span>
  {@render summary()}
</button>
{#if isOpen}
  {@render children()}
{/if}

<style>
.summary {
  padding: 0;
  display: flex;
  align-items: center;
  text-align: left;
  gap: 8px;
}

.indicator {
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid currentColor;
  transition: transform 0.06s ease;
  transform-origin: center;
}

.indicator.open {
  transform: rotate(90deg);
}
</style>