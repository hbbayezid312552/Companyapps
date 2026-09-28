import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

function createIcon(size, filename) {
  const png = new PNG({ width: size, height: size });
  const radius = size * 0.22;
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Rounded rectangle test
      const dx = Math.max(0, Math.abs(x - center) - (center - radius));
      const dy = Math.max(0, Math.abs(y - center) - (center - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        // Outside rounded rect
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Inside: gradient from navy blue #1e40af to vibrant blue #0284c7
      const t = (x + y) / (size * 2);
      const r = Math.round(30 * (1 - t) + 2 * t);
      const g = Math.round(64 * (1 - t) + 132 * t);
      const b = Math.round(175 * (1 - t) + 199 * t);

      // Inner invoice card check
      const cardMarginX = size * 0.22;
      const cardMarginTop = size * 0.16;
      const cardMarginBottom = size * 0.16;
      if (
        x >= cardMarginX &&
        x <= size - cardMarginX &&
        y >= cardMarginTop &&
        y <= size - cardMarginBottom
      ) {
        // Card background white
        let cr = 255;
        let cg = 255;
        let cb = 255;

        // Top blue banner
        if (y >= cardMarginTop + size * 0.05 && y <= cardMarginTop + size * 0.12 && x >= cardMarginX + size * 0.06 && x <= size - cardMarginX - size * 0.06) {
          cr = 30; cg = 64; cb = 175;
        }

        // Table lines
        if (y >= size * 0.42 && y <= size * 0.44 && x >= cardMarginX + size * 0.06 && x <= size - cardMarginX - size * 0.06) {
          cr = 203; cg = 213; cb = 225;
        }
        if (y >= size * 0.52 && y <= size * 0.54 && x >= cardMarginX + size * 0.06 && x <= size - cardMarginX - size * 0.06) {
          cr = 226; cg = 232; cb = 240;
        }
        if (y >= size * 0.62 && y <= size * 0.64 && x >= cardMarginX + size * 0.06 && x <= size - cardMarginX - size * 0.06) {
          cr = 226; cg = 232; cb = 240;
        }

        // Total green badge
        if (y >= size * 0.70 && y <= size * 0.77 && x >= size * 0.45 && x <= size - cardMarginX - size * 0.06) {
          cr = 16; cg = 185; cb = 129;
        }

        png.data[idx] = cr;
        png.data[idx + 1] = cg;
        png.data[idx + 2] = cb;
        png.data[idx + 3] = 255;
      } else {
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
      }
    }
  }

  const outPath = path.join(process.cwd(), 'public', filename);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${outPath} (${size}x${size})`);
}

createIcon(192, 'icon-192.png');
createIcon(512, 'icon-512.png');
createIcon(180, 'apple-touch-icon.png');
