import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const roots = ['src/content/blog', 'src/docs/blog'];
const output = 'public/optimized/blog-thumbs';
const utility = 'src/utils/blog-thumbnail.ts';

const variants = {
  list: 960,
  related: 144,
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
}

function getHeroImages() {
  const images = new Set();

  for (const root of roots) {
    for (const file of walk(root)) {
      if (!/\.(md|mdx)$/i.test(file)) continue;

      const content = fs.readFileSync(file, 'utf8');
      const frontmatter = content.match(/^\uFEFF?---\s*\r?\n([\s\S]*?)\r?\n---/);
      if (!frontmatter) continue;

      const match = frontmatter[1].match(
        /^heroImage:\s*(.+?)\s*$/m
      );
      if (!match) continue;

      const raw = match[1].trim()
        .replace(/^["']|["']$/g, '');

      if (!raw.startsWith('/') || raw.startsWith('//')) continue;

      const pathname = new URL(
        raw, 'https://nekogaku.invalid'
      ).pathname;

      images.add(decodeURIComponent(pathname));
    }
  }

  return [...images].sort();
}

fs.mkdirSync(output, { recursive: true });

const images = getHeroImages();
const mapping = {};

let generated = 0;
let reused = 0;

for (const image of images) {
  const relative = image.replace(/^\/+/, '');
  const input = path.resolve('public', relative);
  const publicRoot = path.resolve('public') + path.sep;

  if (!input.startsWith(publicRoot) || !fs.existsSync(input)) {
    console.warn('SKIP missing/unsafe image:', image);
    continue;
  }

  const source = fs.readFileSync(input);
  const hash = crypto.createHash('sha256')
    .update(image)
    .update(source)
    .digest('hex')
    .slice(0, 16);

  mapping[image] = {};

  for (const [kind, width] of Object.entries(variants)) {
    const filename = `${hash}-${kind}.webp`;
    const dest = path.join(output, filename);

    if (!fs.existsSync(dest)) {
      await sharp(input)
        .rotate()
        .resize({
          width,
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 5 })
        .toFile(dest);

      generated++;
    } else {
      reused++;
    }

    mapping[image][kind] =
      `/optimized/blog-thumbs/${filename}`;
  }
}

const code = `import type { ImageMetadata } from 'astro';

const thumbnails: Record<string, {
  list: string;
  related: string;
}> = ${JSON.stringify(mapping, null, 2)};

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
`;

fs.mkdirSync(path.dirname(utility), { recursive: true });
fs.writeFileSync(utility, code);

console.log('=== AUTOMATIC BLOG IMAGE OPTIMIZATION ===');
console.log('Blog hero images:', images.length);
console.log('Optimized sources:', Object.keys(mapping).length);
console.log('New WebP files:', generated);
console.log('Reused WebP files:', reused);
console.log('Generated mapping:', utility);
