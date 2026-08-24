// Vue Router setup. Every "screen" in the brief is a real route here —
// navigating between them changes the URL and is bookmarkable/refreshable,
// rather than being different pieces of client-only state inside one
// giant component.
import { createRouter, createWebHistory } from 'vue-router'

// Views are lazy-loaded (the `() => import(...)` arrow function form)
// instead of imported directly at the top of the file. Vite splits each
// of these into its own JS chunk that's only downloaded when the user
// actually navigates to that route, instead of all views being bundled
// into the initial page load.
const routes = [
  {
    path: '/',
    redirect: '/employees',
  },
  {
    path: '/employees',
    name: 'employees-dashboard',
    component: () => import('@/views/EmployeesDashboardView.vue'),
  },
  {
    path: '/employees/new',
    name: 'employee-create',
    component: () => import('@/views/EmployeeFormView.vue'),
  },
  {
    // :companyCode is a route PARAM — Vue Router extracts it from the URL
    // and hands it to the component as `route.params.companyCode`.
    path: '/employees/:companyCode',
    name: 'employee-profile',
    component: () => import('@/views/EmployeeProfileView.vue'),
    // props: true forwards route params as component PROPS instead of
    // the component having to reach into `useRoute()` itself. This keeps
    // the view decoupled from the router — it just declares
    // `defineProps(['companyCode'])` like any other component.
    props: true,
  },
  {
    path: '/employees/:companyCode/edit',
    name: 'employee-edit',
    component: () => import('@/views/EmployeeFormView.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  // createWebHistory gives clean URLs (/employees/1001) using the
  // browser's real History API, as opposed to createWebHashHistory's
  // (/#/employees/1001). Requires the dev/prod server to fall back to
  // index.html for unknown paths, which Vite's dev server does out of
  // the box.
  history: createWebHistory(),
  routes,
})
