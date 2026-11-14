import { TinaCloudAuthProvider } from 'tinacms';
  const provider = new TinaCloudAuthProvider({
    clientId: '70ea1304-199c-438b-92e0-c2a44d871575',
    identityApiUrl: 'https://identity.tinajs.io',
    frontendUrl: 'https://app.tina.io',
    tokenStorage: 'LOCAL_STORAGE',
  });
  const NEXUS_OWNER_HASH = "799e0adfd93ab640fc358f4673104045dbae27beaa5df9881173ca67ada333e7";
  async function isNexusOwner(user: unknown): Promise<boolean> {
    if (!user || typeof user !== "object") return false;
    const u = user as { id?: unknown; verified?: unknown; enabled?: unknown };
    if (typeof u.id !== "string" || !u.id || u.verified !== true || u.enabled !== true) return false;
    const bytes = new TextEncoder().encode(u.id);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hash === NEXUS_OWNER_HASH;
  }
  const state = window as Window & { __nexusTinaAdmin?: boolean };
  const adminWindow = window as Window & { __nexusBlogMutation?: (kind: string, pathname: string, sticky: boolean) => Promise<void> };
  adminWindow.__nexusBlogMutation = async (kind, pathname, sticky) => {
    const user = await provider.getUser();
    if (!user || !(await isNexusOwner(user))) throw new Error("Administrator login required");
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
      state.__nexusTinaAdmin = await isNexusOwner(user);
      apply();
    } catch {
      if (current === revision) { state.__nexusTinaAdmin = false; apply(); }
    }
  }
  document.addEventListener('astro:page-load', refreshAdmin);
  window.addEventListener('focus', refreshAdmin);
  window.addEventListener('storage', event => { if (event.key === 'tinacms-auth' || event.key === null) refreshAdmin(); });
  refreshAdmin();
