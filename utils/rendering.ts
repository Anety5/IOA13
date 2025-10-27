// utils/rendering.ts
declare const marked: any;
declare const katex: any;

/**
 * Renders a string containing Markdown and KaTeX math.
 * It uses a placeholder strategy to prevent Markdown parsing from interfering with LaTeX.
 * @param text The raw string to render.
 * @returns An HTML string.
 */
export const renderMarkdown = (text: string | null): string => {
    if (text === null || typeof text === 'undefined') {
        return '';
    }
    
    // Fallback for when libraries aren't loaded or for simple text
    if (typeof marked === 'undefined' || typeof katex === 'undefined') {
        return `<pre class="whitespace-pre-wrap font-sans text-sm">${text}</pre>`;
    }

    try {
        const inlineMathBlocks: string[] = [];
        const blockMathBlocks: string[] = [];
        let html = text;

        // 1. Extract block math ($$ ... $$)
        html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, expression) => {
            blockMathBlocks.push(expression);
            return `__BLOCK_MATH_PLACEHOLDER_${blockMathBlocks.length - 1}__`;
        });

        // 2. Extract inline math ($ ... $)
        // This regex avoids matching escaped dollar signs and handles nested structures.
        html = html.replace(/(?<!\\)\$((?:\\.|[^$])+?)\$/g, (match, expression) => {
             const trimmed = expression.trim();
             // Avoid matching single numbers or currency-like amounts
             if (!trimmed || /^[\d,]+(\.\d+)?$/.test(trimmed)) {
                 return match;
             }
             inlineMathBlocks.push(expression);
             return `__INLINE_MATH_PLACEHOLDER_${inlineMathBlocks.length - 1}__`;
        });
        
        // 3. Process the remaining text with Marked
        html = marked.parse(html);
        
        // 4. Replace placeholders with KaTeX-rendered HTML
        html = html.replace(/__INLINE_MATH_PLACEHOLDER_(\d+)__/g, (_, index) => {
            try {
                return katex.renderToString(inlineMathBlocks[parseInt(index, 10)], { 
                    displayMode: false, 
                    throwOnError: false 
                });
            } catch (e) {
                console.error("KaTeX inline rendering error:", e);
                return `$\\text{${inlineMathBlocks[parseInt(index, 10)]}}$`; // Fallback to text
            }
        });

        html = html.replace(/__BLOCK_MATH_PLACEHOLDER_(\d+)__/g, (_, index) => {
            try {
                return katex.renderToString(blockMathBlocks[parseInt(index, 10)], { 
                    displayMode: true, 
                    throwOnError: false 
                });
            } catch (e) {
                console.error("KaTeX block rendering error:", e);
                return `$$\\text{${blockMathBlocks[parseInt(index, 10)]}}$$`; // Fallback to text
            }
        });

        return html;
    } catch(e) {
        console.error("Markdown/KaTeX rendering failed:", e);
        // Final fallback to preformatted text on any catastrophic error
        return `<pre class="whitespace-pre-wrap font-sans text-sm">${text}</pre>`;
    }
};
