// 产品站共用主题：默认主题加统一页脚。文档页带侧栏时默认页脚不显示，所以放在布局底部。
import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import SiteFooter from "./SiteFooter.vue";

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, { "layout-bottom": () => h(SiteFooter) }),
};
