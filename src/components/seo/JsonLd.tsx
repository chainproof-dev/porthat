/**
 * JSON-LD Component
 * Renders structured data script tags
 */

interface JsonLdProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any> | Array<Record<string, any>>;
}

/**
 * Renders JSON-LD structured data as a script tag
 * Supports single schema or array of schemas
 */
export function JsonLd({ data }: JsonLdProps) {
    const schemas = Array.isArray(data) ? data : [data];

    return (
        <>
            {schemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}
