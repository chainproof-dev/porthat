import { createFileRoute } from "@tanstack/react-router";
import NotFound from "../components/common/NotFound";

// =============================================================================
// CATCH-ALL ROUTE (404 HANDLER)
// =============================================================================

/**
 * Catch-all route that handles any unmatched URLs.
 * This file MUST be named $.tsx to catch all routes.
 * 
 * TanStack Router uses this pattern for 404 handling:
 * - The $ in the filename catches any remaining path segments
 * - We render the NotFound component for any unmatched route
 */
export const Route = createFileRoute("/$")({
    component: NotFound,
});
