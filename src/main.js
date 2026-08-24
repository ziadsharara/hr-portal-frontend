// App entry point. This file wires up the three "app-level plugins"
// every non-trivial Vue app has: routing (vue-router), shared state
// (pinia), and global styles — then mounts the root component into
// <div id="app"> from index.html.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

// .use() registers a Vue PLUGIN. Plugins get a chance to run setup code
// (install() internally) and typically call app.provide(...) so every
// component in the tree can access them — that's how `useRouter()` /
// `useRoute()` and `useXStore()` work anywhere without manual prop
// drilling.
app.use(createPinia())
app.use(router)

app.mount('#app')
