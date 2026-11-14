import { TinaCloudAuthProvider } from 'tinacms';
  const provider = new TinaCloudAuthProvider({
    clientId: '70ea1304-199c-438b-92e0-c2a44d871575',
    identityApiUrl: 'https://identity.tinajs.io',
    frontendUrl: 'https://app.tina.io',
    tokenStorage: 'LOCAL_STORAGE',
  });
  const state = window as Window & { __nexusTinaAdmin?: boolean };
  const adminWindow = window as Window & { __nexusBlogMutation?: (kind: string, pathname: string, sticky: boolean) => Promise<void> };
  adminWindow.__nexusBlogMutation = async (kind, pathname, sticky) => {
    const user = await provider.getUser();
    if (!user || user.verified !== true || user.enabled !== true || String(user.role).toLowerCase() !== "admin") throw new Error("Administrator login required");
    const slug = new RegExp("^/blog/([^/]+)/?$").exec(pathname)?.[1];
    if (!slug) throw new Error("Invalid article path");
    const token = await provider.getToken();
    if (!token?.id_token) throw new Error("Please sign in to TinaCMS");
    const relativePath = decodeURIComponent(slug) + ".md";
    const deleting = kind === "delete";
    if (!deleting && kind !== "pin" && kind !== "draft") throw new Error("Unsupported action");
    const query = deleting
      ? `mutation RemoveBlog($relativePath: String!) { deleteDocument(collection: "blog", relativePath: $relativePath) { __typename } }`
      : `mutation SaveBlog($relativePath: String!, $params: BlogMutation!) { updateBlog(relativePath: $relativePath, params: $params) { id } }`;
    const variables = deleting ? { relativePath } : { relativePath, params: kind === "pin" ? { sticky } : { draft: true } };
    const response = await fetch("https://content.tinajs.io/3.0/content/70ea1304-199c-438b-92e0-c2a44d871575/github/v1", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token.id_token },
      body: JSON.stringify({ query, variables }),
    });
    const result = await response.json();
    if (!response.ok || result.errors?.length || !result.data) throw new Error(result.errors?.[0]?.message || "TinaCMS update failed");
  };
  let revision = 0;
  async function refreshAdmin() {
    const current = ++revision;
    state.__nexusTinaAdmin = false;
    const apply = () => {
      const editing = state.__nexusTinaAdmin === true || ['localhost', '127.0.0.1'].includes(location.hostname);
      document.querySelectorAll<HTMLElement>('[data-editorial-editor-menu]').forEach(el => { el.hidden = !editing; });
      document.querySelectorAll<HTMLElement>('[data-editorial-public-menu]').forEach(el => { el.hidden = editing; });
      document.dispatchEvent(new Event("nexus-admin-auth-change"));
    };
    apply();
    try {
      if (!localStorage.getItem('tinacms-auth')) return;
      const user = await provider.getUser();
      if (current !== revision) return;
      state.__nexusTinaAdmin = Boolean(user && user.verified === true && user.enabled === true && String(user.role).toLowerCase() === 'admin');
      apply();
    } catch {
      if (current === revision) { state.__nexusTinaAdmin = false; apply(); }
    }
  }
  document.addEventListener('astro:page-load', refreshAdmin);
  window.addEventListener('focus', refreshAdmin);
  window.addEventListener('storage', event => { if (event.key === 'tinacms-auth' || event.key === null) refreshAdmin(); });
  refreshAdmin();
