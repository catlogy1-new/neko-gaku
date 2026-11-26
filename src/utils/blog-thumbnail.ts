import type { ImageMetadata } from 'astro';

const thumbnails: Record<string, {
  list: string;
  related: string;
}> = {
  "/Drag/Drag.jpg": {
    "list": "/optimized/blog-thumbs/e35de25da95d64a0-list.webp",
    "related": "/optimized/blog-thumbs/e35de25da95d64a0-related.webp"
  },
  "/Drag/あゝ、荒野.jpg": {
    "list": "/optimized/blog-thumbs/d414cb27f82a5d53-list.webp",
    "related": "/optimized/blog-thumbs/d414cb27f82a5d53-related.webp"
  },
  "/images/らいあ.jpeg": {
    "list": "/optimized/blog-thumbs/5a739d5515b8e0c8-list.webp",
    "related": "/optimized/blog-thumbs/5a739d5515b8e0c8-related.webp"
  },
  "/イジメ/らいあ.jpeg": {
    "list": "/optimized/blog-thumbs/f3d1cd062be4d008-list.webp",
    "related": "/optimized/blog-thumbs/f3d1cd062be4d008-related.webp"
  },
  "/イジメ/イジメ.jpeg": {
    "list": "/optimized/blog-thumbs/d3cd038ee5336b9f-list.webp",
    "related": "/optimized/blog-thumbs/d3cd038ee5336b9f-related.webp"
  },
  "/風景/天体の理想.jpeg": {
    "list": "/optimized/blog-thumbs/70149e0db3ca063f-list.webp",
    "related": "/optimized/blog-thumbs/70149e0db3ca063f-related.webp"
  }
};

export function blogThumbnail(
  src: ImageMetadata | string,
  kind: 'list' | 'related'
): ImageMetadata | string {
  if (typeof src !== 'string') return src;

  try {
    const key = decodeURIComponent(
      new URL(src, 'https://nekogaku.invalid').pathname
    );
    return thumbnails[key]?.[kind] ?? src;
  } catch {
    return src;
  }
}
