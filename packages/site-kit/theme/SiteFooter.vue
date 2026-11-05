<template>
  <footer class="site-footer">
    <!-- 指向站根的跨站链接，target 让 VitePress 路由放行，不套当前 base -->
    <a href="/" target="_self">done-coding 首页</a>
    <a href="/privacy.html" target="_self">隐私说明</a>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
}
</style>
