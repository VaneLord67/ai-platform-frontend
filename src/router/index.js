import VueRouter from 'vue-router'

const HomePage = () => import('../components/home/HomePage.vue')
const Login = () => import('../components/user/Login.vue')
const Detection = () => import('../components/ai/Detection.vue')
const Recognition = () => import('../components/ai/Recognition.vue')
const Track = () => import('../components/ai/Track.vue')
const RequestLog = () => import('../components/monitor/RequestLog.vue')
const Load = () => import('../components/monitor/Load.vue')
const Statistics = () => import('../components/monitor/Statistics.vue')
const AuthManage = () => import("../components/user/AuthManage.vue")

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
			name: 'detection',
			path: '/detection',
			component: Detection,
		},
		{
			name: 'recognition',
			path: '/recognition',
			component: Recognition,
		},
		{
			name: 'track',
			path: '/track',
			component: Track,
		},
		{
			name: 'monitor',
			path: '/monitor/requestLog',
			component: RequestLog,
		},
		{
			name: 'load',
			path: '/monitor/load',
			component: Load,
		},
		{
			name: 'statistics',
			path: '/monitor/statistics',
			component: Statistics,
		},
		{
			name: 'authManage',
			path: '/auth/manage',
			component: AuthManage,
		}
	]
})


// 下面这段防止跳转重复路由时报错
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
	return originalPush.call(this, location).catch(err => err)
}

export default router;