import VueRouter from 'vue-router'

const HomePage = () => import('../components/home/HomePage.vue')
const Login = () => import('../components/user/Login.vue')
const Register = () => import('../components/user/Register')

//创建并暴露一个路由器
const router = new VueRouter({
	mode: "history",
	routes: [
		{
			name: 'homePage',
			path: '/',
			component: HomePage,
		},
		{
			name: 'login',
			path: '/login',
			component: Login,
		},
		{
			name: 'register',
			path: '/register',
			component: Register,
		},
	]
})


// 下面这段防止跳转重复路由时报错
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
	return originalPush.call(this, location).catch(err => err)
}

export default router;