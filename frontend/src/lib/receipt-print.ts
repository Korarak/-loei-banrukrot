import { PAPER_SIZES, type PaperSizeId } from './receipt';

// Popup-window print: prints only the injected element's outerHTML by construction,
// so no global `visibility:hidden` / id-matching print CSS is needed anywhere.
export function printReceiptElement(elementId: string, paperSizeId: PaperSizeId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const size = PAPER_SIZES.find(s => s.id === paperSizeId) ?? PAPER_SIZES[0];

    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }

    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(l => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`)
        .join('\n');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${styleLinks}
<style>
@page { size: ${size.pageSize}; margin: ${size.margin}; }
body { margin: 0; padding: 0; background: white; }
* { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
</style>
</head>
<body><div style="width: ${size.contentWidth}; margin: 0 auto;">${el.outerHTML}</div></body>
</html>`);
    win.document.close();
    win.onafterprint = () => win.close();
    setTimeout(() => win.print(), 600);
}

export async function saveReceiptAsImage(elementId: string, filename: string) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2 });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
}
