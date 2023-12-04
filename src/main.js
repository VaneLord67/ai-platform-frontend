import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue'
import { Axios } from './service'
//引入VueRouter
import VueRouter from 'vue-router'
//引入路由器
import router from './router'

Vue.config.productionTip = false
Vue.use(VueRouter);
Vue.prototype.$axios = Axios
Vue.use(ElementUI);

new Vue({
  render: h => h(App),
  router: router,
}).$mount('#app')
