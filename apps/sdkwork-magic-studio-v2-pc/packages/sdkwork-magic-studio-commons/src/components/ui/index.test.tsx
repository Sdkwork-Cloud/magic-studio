import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from './index';

describe('ui compatibility primitives', () => {
  it('renders shadcn-style select markup through the compatibility wrapper', () => {
    const html = renderToStaticMarkup(
      <Select onValueChange={() => undefined} value="news">
        <SelectTrigger className="custom-trigger">
          <SelectValue placeholder="Choose style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="neutral">Neutral</SelectItem>
          <SelectItem value="news">News</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(html).toContain('<select');
    expect(html).toContain('custom-trigger');
    expect(html).toContain('value="neutral"');
    expect(html).toContain('value="news" selected=""');
  });

  it('renders form primitives with native elements', () => {
    const html = renderToStaticMarkup(
      <div>
        <Label htmlFor="voice-name">Voice Name</Label>
        <Input id="voice-name" readOnly value="Studio Narrator" />
        <Textarea readOnly value="Warm and stable narration" />
      </div>,
    );

    expect(html).toContain('<label');
    expect(html).toContain('<input');
    expect(html).toContain('<textarea');
  });
});
