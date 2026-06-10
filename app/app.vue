<template>
  <div class="app-container">
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <footer class="dev-credit">
      <span>© {{ year }} Developed by Winai Nunkratok</span>
    </footer>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.dev-credit {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.28);
  transition: color 0.4s ease;
  font-family: var(--font-body, sans-serif);
  text-align: center;
  white-space: nowrap;
  line-height: 1.5;
  user-select: none;
}

.dev-credit:hover {
  pointer-events: auto;
  color: rgba(255, 255, 255, 0.60);
}
</style>
