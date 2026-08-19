import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate it's a TradingView URL
    const tvPattern = /tradingview\.com\/script\//;
    if (!tvPattern.test(url)) {
      return NextResponse.json(
        { error: 'Please provide a valid TradingView script URL (tradingview.com/script/...)' },
        { status: 400 },
      );
    }

    // Try to fetch the page and extract Pine Script code
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch page: ${res.status}` },
          { status: 400 },
        );
      }

      const html = await res.text();

      // Try to extract Pine Script from the page
      // TradingView embeds the script in a <code> or <pre> element, or in a JavaScript variable
      const patterns = [
        / Pine Script.*?<code[^>]*>([\s\S]*?)<\/code>/i,
        /"pine-script-source"[^>]*>([\s\S]*?)<\//i,
        /id="pine-script"[^>]*>([\s\S]*?)<\//i,
        /'sourceCode'\s*:\s*"([^"]{50,})"/,
        /`([\s\S]*?strategy\s*\([^)]+\)[\s\S]*?strategy\.entry[\s\S]*?)`/,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].includes('strategy')) {
          let code = match[1]
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\\n/g, '\n')
            .trim();

          if (code.includes('strategy(') || code.includes('//@version')) {
            return NextResponse.json({ code });
          }
        }
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out. Please copy the code directly.' },
          { status: 408 },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          'Could not extract Pine Script from this URL. Please copy the code manually from TradingView and paste it in the Pine Script tab.',
      },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
