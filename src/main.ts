/**
 * 应用入口
 *
 * 装配：Vue 应用、Pinia、Router、i18n、Element Plus、全局指令、全局样式、错误处理
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';
import i18n from './locales';
import { setupDirectives } from './directives';
import { setupErrorHandler } from './utils/error';

// Element Plus 完整样式（按需引入已在 vite 中通过 resolver 处理）
import 'element-plus/theme-chalk/dark/css-vars.css';
import 'element-plus/dist/index.css';

// 全局样式（必须最后引入，覆盖 EP 默认样式）
import '@/assets/styles/index.scss';

// NProgress 样式
import 'nprogress/nprogress.css';

const app = createApp(App);

// 全局注册 Element Plus 所有图标组件
// 这样模板中可直接使用 <User />、<Setting />、<Odometer /> 等而无需手动 import
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// Pinia 状态管理
app.use(createPinia());

// 路由
app.use(router);

// 国际化
app.use(i18n);

// 全局自定义指令（v-permission / v-role / v-debounce / v-copy）
setupDirectives(app);

// 全局错误处理
setupErrorHandler();

app.mount('#app');
