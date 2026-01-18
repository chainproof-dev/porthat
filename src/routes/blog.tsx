import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BlogLayout } from "../components/blog";

// =============================================================================
// ROUTE DEFINITION - Layout route for all /blog/* pages
// =============================================================================

export const Route = createFileRoute("/blog")({
    component: BlogLayoutWrapper,
});

function BlogLayoutWrapper() {
    return (
        <BlogLayout>
            <Outlet />
        </BlogLayout>
    );
}
