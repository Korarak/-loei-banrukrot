import { NextResponse, type NextRequest } from 'next/server';

// Why this exists: app/loading.tsx makes Next flush the response (HTTP 200) before a page
// can call notFound(), so a missing product would be served as 200 + "not found" UI —
// a soft-404 for Google. Deciding here, before rendering starts, lets us send a real 404.
//
// Only a definite "backend says 404" (or a malformed id) becomes a 404. Network errors and
// 5xx pass through untouched so a backend outage can't make real products look deleted.

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const TTL_MS = 60_000;
const MAX_ENTRIES = 2000;
const missingCache = new Map<string, { missing: boolean; at: number }>();

function notFoundResponse(req: NextRequest) {
    return NextResponse.rewrite(new URL('/__not-found', req.url), { status: 404 });
}

async function isMissing(id: string): Promise<boolean> {
    const hit = missingCache.get(id);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.missing;

    const internal = process.env.INTERNAL_API_URL
        || (process.env.NODE_ENV === 'production' ? 'http://backend:8080' : 'http://localhost:8080');
    try {
        const res = await fetch(`${internal}/api/products/${id}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(2000),
        });
        if (res.status !== 404 && !res.ok) return false; // outage / 5xx — don't cache, don't 404
        const missing = res.status === 404;
        if (missingCache.size >= MAX_ENTRIES) missingCache.clear();
        missingCache.set(id, { missing, at: Date.now() });
        return missing;
    } catch {
        return false;
    }
}

export async function proxy(req: NextRequest) {
    const id = req.nextUrl.pathname.split('/')[2];
    if (!id) return NextResponse.next();
    if (!OBJECT_ID.test(id) || (await isMissing(id))) return notFoundResponse(req);
    return NextResponse.next();
}

export const config = {
    matcher: '/products/:id',
};
