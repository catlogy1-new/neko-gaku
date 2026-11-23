type VibeThreadWindow = Window & {
  __navfolioVibeThreadCleanup?: () => void;
  __navfolioVibeThreadEvents?: boolean;
};

type VibeDotPosition = {
  x: number;
  y: number;
};

const getVibeThreadWindow = (): VibeThreadWindow => window as VibeThreadWindow;

const clearVibeThread = (): void => {
  const vibeWindow = getVibeThreadWindow();

  vibeWindow.__navfolioVibeThreadCleanup?.();
  vibeWindow.__navfolioVibeThreadCleanup = undefined;
};

const getDotPositions = (stream: HTMLElement): VibeDotPosition[] => {
  const streamBox = stream.getBoundingClientRect();

  const dots = Array.from(
    stream.querySelectorAll<HTMLElement>('[data-vibe-dot]')
  ).filter((dot) => dot.getClientRects().length > 0);

  return dots.flatMap((dot) => {
    const item = dot.closest<HTMLElement>('.vibe-item');
    const headbox = item?.querySelector<HTMLElement>('.vibe-headbox');

    if (!item || !headbox) return [];

    const itemBox = item.getBoundingClientRect();
    const box = headbox.getBoundingClientRect();

    let x = box.left + box.width / 2;

    if (item.classList.contains('left')) {
      x = box.right + 18;
    } else if (item.classList.contains('right')) {
      x = box.left - 18;
    }

    // 投稿の位置に追従しつつ、左右の振れ幅を抑える
    const centerX = streamBox.left + streamBox.width / 2;
    const curveStrength = 0.60;
    x = centerX + (x - centerX) * curveStrength;

    const y = box.top + 4;

    dot.style.left = `${x - itemBox.left}px`;
    dot.style.right = 'auto';
    dot.style.top = `${y - itemBox.top}px`;
    dot.style.transform = 'translate(-50%, -50%)';

    return [{
      x: x - streamBox.left,
      y: y - streamBox.top + 28,
    }];
  });
};

const buildVibeThreadPath = (dots: VibeDotPosition[]): string => {
  if (dots.length < 2) {
    return '';
  }

  const commands = [`M ${dots[0].x.toFixed(2)} ${dots[0].y.toFixed(2)}`];

  for (let index = 0; index < dots.length - 1; index += 1) {
    const previous = dots[index - 1] ?? dots[index];
    const current = dots[index];
    const next = dots[index + 1];
    const after = dots[index + 2] ?? next;
    const segmentGap = Math.max(44, Math.abs(next.y - current.y));
    const smoothness = Math.min(0.24, 34 / segmentGap);
    const c1x = current.x + (next.x - previous.x) * smoothness;
    const c1y = current.y + (next.y - previous.y) * smoothness;
    const c2x = next.x - (after.x - current.x) * smoothness;
    const c2y = next.y - (after.y - current.y) * smoothness;

    commands.push(
      `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`,
    );
  }

  return commands.join(' ');
};

const mountCurrentVibeThread = (): void => {
  clearVibeThread();

  const stream = document.querySelector<HTMLElement>('.vibe-stream');
  const svg = stream?.querySelector<SVGSVGElement>('.vibe-thread');
  const path = svg?.querySelector<SVGPathElement>('[data-vibe-thread-path]');
  const grain = svg?.querySelector<SVGPathElement>('[data-vibe-thread-grain]');

  if (!stream || !svg || !path || !grain) {
    return;
  }

  const drawVibeThread = (): void => {
    const streamBox = stream.getBoundingClientRect();
    const line = buildVibeThreadPath(getDotPositions(stream));

    svg.setAttribute('viewBox', `0 0 ${streamBox.width} ${streamBox.height + 52}`);
    path.setAttribute('d', line);
    grain.setAttribute('d', line);
  };

  const scheduleDraw = (): void => {
    window.requestAnimationFrame(drawVibeThread);
  };
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(scheduleDraw) : null;

  scheduleDraw();
  window.addEventListener('load', scheduleDraw, { once: true });
  window.addEventListener('resize', scheduleDraw);
  resizeObserver?.observe(stream);

  getVibeThreadWindow().__navfolioVibeThreadCleanup = () => {
    window.removeEventListener('resize', scheduleDraw);
    resizeObserver?.disconnect();
  };
};

export const mountVibeThread = (): void => {
  const vibeWindow = getVibeThreadWindow();

  if (!vibeWindow.__navfolioVibeThreadEvents) {
    vibeWindow.__navfolioVibeThreadEvents = true;
    document.addEventListener('astro:page-load', mountCurrentVibeThread);
    document.addEventListener('astro:before-swap', clearVibeThread);
    window.addEventListener('pagehide', clearVibeThread);
  }

  mountCurrentVibeThread();
};
