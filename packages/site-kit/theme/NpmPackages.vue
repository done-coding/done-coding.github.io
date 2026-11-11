<script setup>
import { computed } from "vue";
import { useData } from "vitepress";

const props = defineProps({ home: Boolean });
const { theme, page } = useData();
const packages = computed(() => {
  const path = page.value.relativePath;
  const items = theme.value.npmPackages ?? [];
  return props.home
    ? path === "index.md"
      ? items
      : []
    : path.startsWith("docs/")
      ? items.filter(({ doc }) => doc === path)
      : [];
});
</script>

<template>
  <section
    v-if="packages.length"
    class="npm-packages"
    :class="{ home }"
    aria-label="npm 包"
  >
    <h2 v-if="home">npm 包</h2>
    <ul>
      <li v-for="item in packages" :key="item.name">
        <span v-if="home" class="package-name">{{ item.name }}</span>
        <a
          :href="`https://www.npmjs.com/package/${item.name}`"
          target="_blank"
          rel="noopener"
        >
          <img
            :src="`https://img.shields.io/npm/v/${item.name}?logo=npm`"
            :alt="`${item.name} 的 npm 版本`"
            height="20"
            referrerpolicy="no-referrer"
          />
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.npm-packages {
  margin-bottom: 24px;
  color: var(--vp-c-text-1);
}
.npm-packages.home {
  max-width: 1200px;
  margin: 32px auto 64px;
  padding: 0 24px;
}
h2 {
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 600;
}
ul {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 0;
  list-style: none;
}
li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
}
.package-name {
  overflow-wrap: anywhere;
}
a {
  max-width: 100%;
}
img {
  display: block;
  max-width: 100%;
  height: 20px;
}
</style>
