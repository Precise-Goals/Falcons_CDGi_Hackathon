import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownView } from './MarkdownView';

describe('MarkdownView Component', () => {
  it('parses markdown tables with blank lines between rows', () => {
    const tableWithBlankLines = `
| Metric | Signal | Threshold for Alarm |

|---|---|---|

| 429.fromWallet raw count | Enforced rejection vs. permitted | >2σ from hourly moving average |

| charge.thttpd_gate_lat_p99 | Throttling latency tail | >10% above baseline P99 |

| daily_quota_depletion_moment | Time-to-quota by clientId | Shifted earlier for "normal" wallets by >30 min |
`;

    const html = renderToStaticMarkup(<MarkdownView content={tableWithBlankLines} />);

    // Verify table structure rendered
    expect(html).toContain('<table');
    expect(html).toContain('Metric');
    expect(html).toContain('Signal');
    expect(html).toContain('Threshold for Alarm');

    // Verify cell contents
    expect(html).toContain('429.fromWallet raw count');
    expect(html).toContain('Enforced rejection vs. permitted');
    expect(html).toContain('&gt;2σ from hourly moving average');
    expect(html).toContain('charge.thttpd_gate_lat_p99');
    expect(html).toContain('daily_quota_depletion_moment');
  });

  it('renders heading levels H1 through H6 properly', () => {
    const markdownHeadings = `
# Level 1 Heading
## Level 2 Heading
### Level 3 Heading
#### Level 4 Heading
##### Level 5 Heading
###### Level 6 Heading
`;

    const html = renderToStaticMarkup(<MarkdownView content={markdownHeadings} />);

    expect(html).toContain('<h1');
    expect(html).toContain('Level 1 Heading');
    expect(html).toContain('<h2');
    expect(html).toContain('Level 2 Heading');
    expect(html).toContain('<h3');
    expect(html).toContain('Level 3 Heading');
    expect(html).toContain('<h4');
    expect(html).toContain('Level 4 Heading');
    expect(html).toContain('<h5');
    expect(html).toContain('Level 5 Heading');
    expect(html).toContain('<h6');
    expect(html).toContain('Level 6 Heading');
  });

  it('renders inline links, bold text, and code spans', () => {
    const inlineContent = `Here is [Metrics Documentation](https://intra-vert.vercel.app/docs) with **important** note and \`intra_get_contract\` tool.`;

    const html = renderToStaticMarkup(<MarkdownView content={inlineContent} />);

    expect(html).toContain('<a href="https://intra-vert.vercel.app/docs"');
    expect(html).toContain('Metrics Documentation</a>');
    expect(html).toContain('<strong');
    expect(html).toContain('important</strong>');
    expect(html).toContain('<code');
    expect(html).toContain('intra_get_contract</code>');
  });
});
