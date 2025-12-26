import { useEffect } from 'react';

/**
 * 🚨 TRANSLATION ENFORCEMENT GUARD
 * 
 * This component runs in development mode and warns about
 * any hardcoded text that bypasses the translation system.
 * 
 * HOW IT WORKS:
 * - Scans the DOM for text nodes
 * - Identifies text that's not coming from translation keys
 * - Logs warnings in console with element details
 * 
 * GOAL:
 * Make it IMPOSSIBLE to miss untranslated text during development
 */
export const TranslationEnforcementGuard = () => {
    useEffect(() => {
        if (import.meta.env.MODE !== 'development') return;

        const checkForHardcodedText = () => {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        // Skip empty text nodes
                        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;

                        // Skip script and style tags
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            const suspiciousTexts: Array<{ text: string; element: string }> = [];
            let node: Node | null;

            while ((node = walker.nextNode())) {
                const text = node.textContent?.trim();
                if (!text) continue;

                // Skip if it's just numbers, symbols, or very short
                if (text.length < 3) continue;
                if (/^[\d\s\-\+\*\/\(\)\[\]\{\}]+$/.test(text)) continue;

                // Skip common UI patterns that are OK
                if (/^[A-Z]{1,3}$/.test(text)) continue; // Abbreviations like "ID", "CDF"
                if (/^\d+(\.\d+)?%?$/.test(text)) continue; // Numbers with optional %

                // Check if text looks like English words (potential hardcoded text)
                // This is a heuristic - it will have false positives
                const hasEnglishWords = /\b(the|and|or|is|are|was|were|have|has|had|do|does|did|will|would|should|could|can|may|might|must|shall)\b/i.test(text);
                const hasMultipleWords = text.split(/\s+/).length > 1;

                if (hasEnglishWords || (hasMultipleWords && /^[a-zA-Z\s]+$/.test(text))) {
                    const parent = node.parentElement;
                    suspiciousTexts.push({
                        text: text.substring(0, 50),
                        element: parent?.tagName || 'unknown'
                    });
                }
            }

            if (suspiciousTexts.length > 0) {
                console.group('🚨 TRANSLATION ENFORCEMENT WARNING');
                console.warn(
                    `Found ${suspiciousTexts.length} potentially hardcoded text strings.`,
                    '\nThese should use t() from useTranslation.'
                );
                suspiciousTexts.forEach(({ text, element }) => {
                    console.warn(`  • <${element}>: "${text}"`);
                });
                console.groupEnd();
            }
        };

        // Check after initial render
        const timer = setTimeout(checkForHardcodedText, 2000);

        // Check on route changes
        const observer = new MutationObserver(() => {
            clearTimeout(timer);
            setTimeout(checkForHardcodedText, 500);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    return null;
};
