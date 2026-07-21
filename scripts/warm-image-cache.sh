#!/usr/bin/env bash
#
# Warms Next.js's on-demand image-optimization cache for product listing
# images, so the first real customer to hit a width+format combination
# nobody has requested yet doesn't pay the live sharp resize+encode cost
# (`x-nextjs-cache: MISS`). The cache itself now survives redeploys (see the
# frontend_image_cache volume in docker-compose.yml), so once a combination
# is warmed it stays warm — there's no need to re-warm the whole catalog on
# every deploy.
#
# Two modes:
#   (default)  Fast delta warm — only the most recently added products
#              (newest-first is the API's default sort), 2 breakpoints.
#              Cheap enough to run after every deploy from CI.
#   --full     One-off full-catalog backfill — every product, every
#              deviceSize in next.config.ts, both AVIF/WebP. AVIF encoding is
#              CPU-heavy; measured ~15s/product on the production VPS across
#              the full 6-size x 2-format matrix, i.e. over an hour for the
#              whole catalog. Run this by hand, off to the side, not from CI
#              — it competes for the same CPU real visitors need.
#
# Usage:
#   ./scripts/warm-image-cache.sh [--full] [base_url]
#   (base_url defaults to https://banrukrot.com)

set -euo pipefail

FULL=false
BASE_URL="https://banrukrot.com"
for arg in "$@"; do
    case "$arg" in
        --full) FULL=true ;;
        http*) BASE_URL="$arg" ;;
    esac
done
export BASE_URL

if $FULL; then
    DEVICE_SIZES=(640 750 828 1080 1200 1920)
    CONCURRENCY=4  # bounded globally (not per-image) to avoid starving real traffic
    echo "Full catalog backfill mode ($BASE_URL) — this is CPU-heavy and can take over an hour. Run manually, not from CI."
else
    DEVICE_SIZES=(640 1080)  # mobile baseline + desktop/retina; covers most ProductCard grid requests
    CONCURRENCY=6
    echo "Fast delta warm mode ($BASE_URL) — most recently added products only."
fi

echo "Waiting for $BASE_URL to come up after deploy..."
ready=false
for i in $(seq 1 30); do
    if curl -sf -o /dev/null "$BASE_URL/api/status"; then
        ready=true
        break
    fi
    sleep 2
done
if ! $ready; then
    echo "Backend never became ready after 60s, skipping cache warm for this deploy."
    exit 0
fi

echo "Fetching product catalog..."

page=1
image_paths=()
while :; do
    if $FULL; then
        response=$(curl -sf "$BASE_URL/api/products?limit=100&page=$page")
        total_pages=$(echo "$response" | jq -r '.pagination.pages')
    else
        response=$(curl -sf "$BASE_URL/api/products?limit=50")
        total_pages=1
    fi

    # Primary image if one is flagged, else the product's first image.
    mapfile -t page_paths < <(echo "$response" | jq -r \
        '.data[] | (.images | (map(select(.isPrimary)) + .))[0].imagePath // empty')
    image_paths+=("${page_paths[@]}")

    [ "$page" -ge "$total_pages" ] && break
    page=$((page + 1))
done

mapfile -t image_paths < <(printf '%s\n' "${image_paths[@]}" | sort -u | grep -v '^$')

job_file=$(mktemp)
trap 'rm -f "$job_file"' EXIT
for path in "${image_paths[@]}"; do
    for w in "${DEVICE_SIZES[@]}"; do
        echo "$path $w avif" >> "$job_file"
        echo "$path $w webp" >> "$job_file"
    done
done

total_jobs=$(wc -l < "$job_file")
echo "Warming ${#image_paths[@]} images x ${#DEVICE_SIZES[@]} sizes x 2 formats = $total_jobs requests (concurrency=$CONCURRENCY)..."

xargs -P "$CONCURRENCY" -n 3 -a "$job_file" bash -c '
    curl -s -o /dev/null -G -H "Accept: image/$3" \
        --data-urlencode "url=$1" --data-urlencode "w=$2" --data-urlencode "q=75" \
        "$BASE_URL/_next/image"
' bash

echo "Cache warming complete."
