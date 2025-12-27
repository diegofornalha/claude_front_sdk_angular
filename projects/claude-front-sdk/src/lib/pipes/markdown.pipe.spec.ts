import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkdownPipe]
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  describe('empty and null values', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null as any)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined as any)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(pipe.transform('')).toBe('');
    });
  });

  describe('headers', () => {
    it('should convert ## to h2', () => {
      const result = extractHtml(pipe.transform('## Header 2'));
      expect(result).toContain('<h2>Header 2</h2>');
    });

    it('should convert ### to h3', () => {
      const result = extractHtml(pipe.transform('### Header 3'));
      expect(result).toContain('<h3>Header 3</h3>');
    });
  });

  describe('bold text', () => {
    it('should convert **text** to strong', () => {
      const result = extractHtml(pipe.transform('This is **bold** text'));
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should convert __text__ to strong', () => {
      const result = extractHtml(pipe.transform('This is __bold__ text'));
      expect(result).toContain('<strong>bold</strong>');
    });
  });

  describe('italic text', () => {
    it('should convert *text* to em', () => {
      const result = extractHtml(pipe.transform('This is *italic* text'));
      expect(result).toContain('<em>italic</em>');
    });

    it('should convert _text_ to em', () => {
      const result = extractHtml(pipe.transform('This is _italic_ text'));
      expect(result).toContain('<em>italic</em>');
    });
  });

  describe('code', () => {
    it('should convert inline `code` to code tags', () => {
      const result = extractHtml(pipe.transform('Use `const x = 1` here'));
      expect(result).toContain('<code>const x = 1</code>');
    });

    it('should convert code blocks to pre/code', () => {
      const input = '```javascript\nconst x = 1;\n```';
      const result = extractHtml(pipe.transform(input));
      expect(result).toContain('<pre><code>');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('</code></pre>');
    });
  });

  describe('lists', () => {
    it('should convert - items to ul/li', () => {
      const input = '- Item 1\n- Item 2';
      const result = extractHtml(pipe.transform(input));
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      expect(result).toContain('</ul>');
    });

    it('should convert * items to ul/li', () => {
      const input = '* Item A\n* Item B';
      const result = extractHtml(pipe.transform(input));
      expect(result).toContain('<li>Item A</li>');
      expect(result).toContain('<li>Item B</li>');
    });
  });

  describe('checkboxes', () => {
    it('should convert [x] to checked checkbox', () => {
      const result = extractHtml(pipe.transform('[x] Done task'));
      expect(result).toContain('class="checkbox checked"');
    });

    it('should convert [ ] to unchecked checkbox', () => {
      const result = extractHtml(pipe.transform('[ ] Pending task'));
      expect(result).toContain('class="checkbox"');
    });
  });

  describe('line breaks', () => {
    it('should convert newlines to br', () => {
      const result = extractHtml(pipe.transform('Line 1\nLine 2'));
      expect(result).toContain('<br>');
    });
  });

  describe('HTML escaping', () => {
    it('should escape < and >', () => {
      const result = extractHtml(pipe.transform('<script>alert("xss")</script>'));
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should escape &', () => {
      const result = extractHtml(pipe.transform('Tom & Jerry'));
      expect(result).toContain('&amp;');
    });
  });

  describe('complex markdown', () => {
    it('should handle mixed formatting', () => {
      const input = '## Title\n\nThis is **bold** and *italic*.\n\n- Item 1\n- Item 2';
      const result = extractHtml(pipe.transform(input));

      expect(result).toContain('<h2>Title</h2>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<li>Item 1</li>');
    });
  });
});

// Helper to extract HTML string from SafeHtml
function extractHtml(safeHtml: SafeHtml): string {
  // SafeHtml.toString() returns "[object Object]", so we need to access the actual value
  // In tests, we can safely cast and access the internal property
  const htmlString = (safeHtml as any).changingThisBreaksApplicationSecurity || String(safeHtml);
  return htmlString;
}
