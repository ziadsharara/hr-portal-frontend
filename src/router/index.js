// Vue Router setup. Every "screen" in the brief is a real route here —
// navigating between them changes the URL and is bookmarkable/refreshable,
// rather than being different pieces of client-only state inside one
// giant component.
import { createRouter, createWebHistory } from 'vue-router'

// The core CRUD views are imported statically (bundled into the one main
// chunk) rather than lazy-loaded per route. They used to be dynamic
// `() => import(...)` imports, which is the right default on a CDN — but
// this app is served straight from an S3 website endpoint with no CDN,
// no HTTP/2, and no caching in front of it (see DEPLOYMENT.md), where
// each first-time chunk fetch measured ~1s of pure round-trip latency
// regardless of the file being a few KB. All four views combined are
// still well under 50KB gzipped, so bundling them trades that one-time
// per-route network round trip for a negligible increase to the single
// bundle the user already waits for on first load. This is what was
// making "Add Employee" and friends feel slow in production but not in
// local dev, where that round trip is effectively free.
//
// NotFoundView stays lazy — it's off the happy path, so there's no
// reason to make everyone's bundle bigger for it.
import EmployeesDashboardView from '@/views/EmployeesDashboardView.vue'
import EmployeeFormView from '@/views/EmployeeFormView.vue'
import EmployeeProfileView from '@/views/EmployeeProfileView.vue'

const routes = [
  {
    path: '/',
    redirect: '/employees',
  },
  {
    path: '/employees',
    name: 'employees-dashboard',
    component: EmployeesDashboardView,
  },
  {
    path: '/employees/new',
    name: 'employee-create',
    component: EmployeeFormView,
  },
  {
    // :companyCode is a route PARAM — Vue Router extracts it from the URL
    // and hands it to the component as `route.params.companyCode`.
    path: '/employees/:companyCode',
    name: 'employee-profile',
    component: EmployeeProfileView,
    // props: true forwards route params as component PROPS instead of
    // the component having to reach into `useRoute()` itself. This keeps
    // the view decoupled from the router — it just declares
    // `defineProps(['companyCode'])` like any other component.
    props: true,
  },
  {
    path: '/employees/:companyCode/edit',
    name: 'employee-edit',
    component: EmployeeFormView,
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
