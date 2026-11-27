/**
 * Keep Tina's editor form in sync with Media preview navigation.
 * A full admin reload is deliberate: it restores the form for the
 * new route, even when iframe-only navigation loses the active form.
 */
export function installMediaEditorNavigation(): void {
  if (window.self === window.parent) return;

  try {
    if (
      window.parent.location.origin !== window.location.origin ||
      !/^\/admin(?:\/|$)/.test(window.parent.location.pathname)
    ) return;
  } catch {
    return;
  }

  document.addEventListener('click', (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;

    const isBack = link.closest('.media-review-back') !== null;
    const isCard = link.classList.contains(
      'navfolio-media-shelf__item'
    );

    if (!isBack && !isCard) return;

    // Editable fields must be handled by TinaCMS click-to-focus.
    // Cancel the card link without blocking Tina's click listener.
    if (
      isCard &&
      target.closest('[data-tina-field], [data-tina-field-overlay]')
    ) {
      event.preventDefault();
      return;
    }

    if (link.target && link.target !== '_self') return;

    const destination = new URL(link.href);

    if (destination.origin !== window.location.origin) return;
    if (!/^\/media\/(?:[a-zA-Z0-9_-]+\/)?$/.test(
      destination.pathname
    )) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const editor = window.parent.location;
      editor.hash = '#/~' + destination.pathname;
      editor.reload();
    } catch {
      window.location.assign(destination.href);
    }
  }, true);
}
