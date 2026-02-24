export const markdownUtils = {
    parse(markdown: string): string {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
        
        // Strikethrough
        html = html.replace(/~~(.*?)~~/gim, '<del>$1</del>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
        
        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />');
        
        // Blockquotes
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        
        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr />');
        html = html.replace(/^\*\*\*$/gim, '<hr />');
        
        // Unordered lists
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        
        // Ordered lists
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        
        // Paragraphs
        html = html.replace(/\n\n/gim, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/gim, '');
        html = html.replace(/<p>\s*<(h[1-6]|blockquote|pre|ul|ol|li|hr)/gim, '<$1');
        html = html.replace(/<\/(h[1-6]|blockquote|pre|ul|ol|li|hr)>\s*<\/p>/gim, '</$1>');
        
        return html.trim();
    },

    toHtml(markdown: string): string {
        return this.parse(markdown);
    },

    extractText(markdown: string): string {
        let text = markdown;
        
        // Remove headers
        text = text.replace(/^#+\s+.*$/gim, '');
        
        // Remove links but keep text
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/gim, '$1');
        
        // Remove images
        text = text.replace(/!\[[^\]]*\]\([^)]+\)/gim, '');
        
        // Remove formatting
        text = text.replace(/[*_~`]/g, '');
        
        // Remove code blocks
        text = text.replace(/```[\s\S]*?```/gim, '');
        text = text.replace(/`[^`]+`/gim, '');
        
        // Remove blockquotes
        text = text.replace(/^>\s+/gim, '');
        
        // Remove list markers
        text = text.replace(/^[\*\-\d+\.]\s+/gim, '');
        
        // Clean up whitespace
        text = text.replace(/\n+/g, ' ');
        text = text.replace(/\s+/g, ' ');
        
        return text.trim();
    },

    extractHeadings(markdown: string): { level: number; text: string; id: string }[] {
        const headings: { level: number; text: string; id: string }[] = [];
        const regex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        
        while ((match = regex.exec(markdown)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text.toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            headings.push({ level, text, id });
        }
        
        return headings;
    },

    extractLinks(markdown: string): { text: string; url: string }[] {
        const links: { text: string; url: string }[] = [];
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(markdown)) !== null) {
            links.push({ text: match[1], url: match[2] });
        }
        
        return links;
    },

    extractImages(markdown: string): { alt: string; url: string }[] {
        const images: { alt: string; url: string }[] = [];
        const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(markdown)) !== null) {
            images.push({ alt: match[1], url: match[2] });
        }
        
        return images;
    },

    wordCount(markdown: string): number {
        const text = this.extractText(markdown);
        return text.split(/\s+/).filter(word => word.length > 0).length;
    },

    readingTime(markdown: string, wordsPerMinute: number = 200): number {
        const words = this.wordCount(markdown);
        return Math.ceil(words / wordsPerMinute);
    },

    toPlainText(markdown: string): string {
        return this.extractText(markdown);
    },

    sanitize(markdown: string): string {
        // Remove potentially dangerous HTML
        let sanitized = markdown;
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
        sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');
        return sanitized;
    }
};
