import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  ExternalLink,
  Check,
  Share2
} from 'lucide-react';

// Configure pdfjs worker to load from public directory
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface LinkItem {
  url: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PageItemProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
}

function PageItem({ pdfDoc, pageNumber, scale }: PageItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        setDimensions({ width: viewport.width, height: viewport.height });

        // 1. Render Canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (ctx) {
            ctx.scale(dpr, dpr);
            renderTask = page.render({
              canvas,
              canvasContext: ctx,
              viewport,
            });
            await renderTask.promise;
          }
        }
        if (isCancelled) return;

        // 2. Render Text Layer for 100% Native Text Selection
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          textLayerDiv.innerHTML = '';
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.height = `${viewport.height}px`;

          const textContent = await page.getTextContent();
          if (isCancelled) return;

          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport,
          });
          await textLayer.render();
        }
        if (isCancelled) return;

        // 3. Render Hyperlink Annotations
        const annotations = await page.getAnnotations();
        if (isCancelled) return;

        const linkItems: LinkItem[] = annotations
          .filter((a: any) => a.subtype === 'Link' && a.url)
          .map((a: any) => {
            const [x1, y1, x2, y2] = a.rect;
            const p1 = viewport.convertToViewportPoint(x1, y1);
            const p2 = viewport.convertToViewportPoint(x2, y2);
            return {
              url: a.url,
              left: Math.min(p1[0], p2[0]),
              top: Math.min(p1[1], p2[1]),
              width: Math.abs(p2[0] - p1[0]),
              height: Math.abs(p2[1] - p1[1]),
            };
          });

        setLinks(linkItems);
        setIsRendered(true);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (_) {}
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div
      className="relative mx-auto my-8 bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-sm border border-black/10 select-text overflow-hidden group"
      style={{
        width: dimensions.width ? `${dimensions.width}px` : '100%',
        height: dimensions.height ? `${dimensions.height}px` : 'auto',
        maxWidth: '100%',
      }}
    >
      {/* Visual Canvas Layer */}
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />

      {/* Selectable Transparent Text Layer */}
      <div
        ref={textLayerRef}
        className="intra-pdf-text-layer absolute inset-0 overflow-hidden pointer-events-auto select-text"
      />

      {/* Interactive Hyperlink Overlays */}
      {links.map((link, idx) => (
        <a
          key={idx}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open Link: ${link.url}`}
          className="intra-pdf-link absolute z-10 transition-colors duration-150 rounded-xs cursor-pointer"
          style={{
            left: `${link.left}px`,
            top: `${link.top}px`,
            width: `${link.width}px`,
            height: `${link.height}px`,
          }}
        />
      ))}

      {/* Bottom Page Badge */}
      <div className="absolute bottom-2 right-4 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-black/40 pointer-events-none select-none border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
        Page {pageNumber} of 3
      </div>

      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream-subtle/50 animate-pulse">
          <span className="font-mono text-xs text-black/40 uppercase tracking-widest">
            Rendering Page {pageNumber}...
          </span>
        </div>
      )}
    </div>
  );
}

export function ResearchPaperViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Responsive zoom control: 1.0 = standard 100%, adjust with container width
  const [containerWidth, setContainerWidth] = useState<number>(850);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1.0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // ResizeObserver to detect container width changes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute responsive scale based on 612pt base PDF width
  const baseScale = Math.max(0.65, Math.min((containerWidth - 32) / 612, 1.45));
  const effectiveScale = baseScale * zoomMultiplier;

  // Load the PDF Document
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);

    async function loadPdf() {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: '/research.pdf' });
        const doc = await loadingTask.promise;
        if (isCancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Failed to load /research.pdf:', err);
        setLoadError(err?.message || 'Failed to load PDF document');
        setIsLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleZoomIn = () => setZoomMultiplier((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoomMultiplier((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoomMultiplier(1.0);

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin + '/research');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div ref={containerRef} className="w-full mx-auto max-w-5xl px-2 sm:px-4 py-4 space-y-6">
      {/* ── EMBEDDED RESEARCH PAPER TOP BAR (BORDERLESS, ZERO-IFRAME) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/95 border border-black/10 shadow-sm backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-crimson/10 flex items-center justify-center text-crimson">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-sm tracking-tight text-black">
                INTRA RESEARCH SPECIFICATION
              </span>
              <span className="px-2 py-0.5 rounded-full bg-crimson text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                ORIGINAL PDF
              </span>
            </div>
            <p className="text-[11px] text-black/60 font-mono">
              3 Pages &bull; Vector Rendered &bull; Text Selection & Hyperlinks Enabled
            </p>
          </div>
        </div>

        {/* Action & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Buttons */}
          <div className="flex items-center bg-black/5 rounded-xl p-1 border border-black/5">
            <button
              onClick={handleZoomOut}
              disabled={zoomMultiplier <= 0.65}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-white text-black/70 hover:text-black transition disabled:opacity-40"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom to 100%"
              className="px-2 py-1 text-[11px] font-mono font-bold text-black/80 hover:text-crimson transition"
            >
              {Math.round(zoomMultiplier * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoomMultiplier >= 1.95}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-white text-black/70 hover:text-black transition disabled:opacity-40"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Share Link */}
          <button
            onClick={handleCopyShareLink}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:border-black/25 text-black text-xs font-mono font-semibold transition shadow-2xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-black/60" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Original Download Link */}
          <a
            href="/research.pdf"
            download="Intra-Research-Paper.pdf"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-crimson hover:bg-crimson-hover text-white text-xs font-mono font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download (306 KB)</span>
          </a>
        </div>
      </div>

      {/* ── LOADING STATE ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
          <div className="w-12 h-12 rounded-full border-3 border-crimson border-t-transparent animate-spin" />
          <div className="font-mono text-xs uppercase tracking-widest text-black/50 font-bold">
            Rendering Academic PDF Pages...
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {loadError && (
        <div className="p-8 rounded-2xl bg-crimson/5 border border-crimson/20 text-center space-y-4">
          <div className="text-crimson font-bold font-display text-base">
            Unable to render /research.pdf natively
          </div>
          <p className="text-xs font-mono text-black/60 max-w-md mx-auto">
            {loadError}
          </p>
          <a
            href="/research.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-crimson text-white font-mono text-xs font-bold"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open PDF Directly</span>
          </a>
        </div>
      )}

      {/* ── BORDERLESS CONTINUOUS PAGES (ZERO IFRAME, ZERO MIN-H / MAX-H) ── */}
      {pdfDoc && !isLoading && (
        <div className="space-y-6">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <PageItem
              key={pageNum}
              pdfDoc={pdfDoc}
              pageNumber={pageNum}
              scale={effectiveScale}
            />
          ))}
        </div>
      )}

      {/* Inline styles for the native PDF text layer and hyperlinks */}
      <style>{`
        .intra-pdf-text-layer {
          line-height: 1;
          caret-color: #C8102E;
          user-select: text;
          -webkit-user-select: text;
          z-index: 2;
        }
        .intra-pdf-text-layer :is(span, br) {
          color: transparent !important;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .intra-pdf-text-layer ::selection {
          background: rgba(200, 16, 46, 0.25) !important;
          color: transparent !important;
        }
        .intra-pdf-link {
          background-color: transparent;
        }
        .intra-pdf-link:hover {
          background-color: rgba(200, 16, 46, 0.15);
          outline: 1.5px dashed #C8102E;
        }
      `}</style>
    </div>
  );
}

export default ResearchPaperViewer;
