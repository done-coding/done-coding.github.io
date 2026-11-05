<script setup>
import { useSidebar } from "vitepress/theme";

const { hasSidebar } = useSidebar();
</script>

<template>
  <footer class="site-footer" :class="{ 'has-sidebar': hasSidebar }">
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

/* 侧栏固定在左侧，页脚要避开它才能在内容区居中 */
@media (min-width: 960px) {
  .site-footer.has-sidebar {
    padding-left: var(--vp-sidebar-width);
  }
}

@media (min-width: 1440px) {
  .site-footer.has-sidebar {
    padding-left: calc(
      (100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width)
    );
  }
}
</style>
