import { createFileRoute } from "@tanstack/react-router";
import { generateRSSFeed } from "../lib/rss";

export const Route = createFileRoute("/rss")({
    loader: () => {
        const rss = generateRSSFeed();
        return { rss };
    },
    component: RSSPage,
});

function RSSPage() {
    const { rss } = Route.useLoaderData();

    // For SSG, we return the raw XML
    // In a real scenario, this would be served with content-type: application/xml
    return (
        <pre style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "monospace",
            fontSize: "12px",
            padding: "20px",
            backgroundColor: "#f5f5f5",
        }}>
            {rss}
        </pre>
    );
}
