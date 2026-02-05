import { createRouter } from '@tanstack/react-router'
import { MinimalNotFound } from './components/common/NotFound'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Global 404 handler for unmatched routes
    defaultNotFoundComponent: MinimalNotFound,
  })

  return router
}
