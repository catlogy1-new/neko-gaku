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
  // NEXUS VERIFIED COMMENT OWNER V1
  (window as Window & {
    __nexusCommentOwnerToken?: () => Promise<string | null>;
  }).__nexusCommentOwnerToken = async () => {
    const user = await provider.getUser();
    if (!(await isNexusOwner(user))) return null;
    const token = await provider.getToken();
    return token?.id_token || null;
  };

  const state = window as Window & { __nexusTinaAdmin?: boolean };
  const adminWindow = window as Window & { __nexusBlogMutation?: (kind: string, pathname: string, sticky: boolean) => Promise<void> };
  const BLOG_FIELDS = `headerKicker heroImagePosition tocVisibility title description date draft tags categories series comments sticky heroImage showHeroImage japaneseUrl japaneseTitle japaneseDescription japaneseBody sidebar { enable toc relatedPosts } body`;
  const BLOG_KEYS = ["headerKicker", "heroImagePosition", "tocVisibility", "title", "description", "date", "draft", "tags", "categories", "series", "comments", "sticky", "heroImage", "showHeroImage", "japaneseUrl", "japaneseTitle", "japaneseDescription", "japaneseBody", "sidebar", "body"];
  const activeMutations = new Set<string>();
  function canonicalBlogValue(value: unknown): string {
    return JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  }
  adminWindow.__nexusBlogMutation = async (kind, pathname, sticky) => {
    const user = await provider.getUser();
    if (!user || !(await isNexusOwner(user))) throw new Error("Administrator login required");
    const slug = new RegExp("^/blog/([^/]+)/?$").exec(pathname)?.[1];
    if (!slug) throw new Error("Invalid article path");
    const decodedSlug = decodeURIComponent(slug);
    if (!/^[a-zA-Z0-9_-]+$/.test(decodedSlug)) throw new Error("Invalid article slug");
    const relativePath = decodedSlug + ".md";
    if (!["delete", "pin", "draft"].includes(kind)) throw new Error("Unsupported action");
    if (activeMutations.has(relativePath)) throw new Error("An update is already in progress");
    activeMutations.add(relativePath);
    try {
      const token = await provider.getToken();
      if (!token?.id_token) throw new Error("Please sign in to TinaCMS");
      async function request(query: string, variables: Record<string, unknown>) {
        const response = await fetch("https://content.tinajs.io/3.0/content/70ea1304-199c-438b-92e0-c2a44d871575/github/v1", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token!.id_token },
          cache: "no-store",
          body: JSON.stringify({ query, variables }),
        });
        const result = await response.json();
        if (!response.ok || result.errors?.length || !result.data) throw new Error(result.errors?.[0]?.message || "TinaCMS request failed");
        return result.data;
      }
      if (kind === "delete") {
        await request(`mutation RemoveBlog($relativePath: String!) { deleteDocument(collection: "blog", relativePath: $relativePath) { __typename } }`, { relativePath });
        return;
      }
      const readQuery = `query ReadCompleteBlog($relativePath: String!) { blog(relativePath: $relativePath) { ${BLOG_FIELDS} } }`;
      const original = (await request(readQuery, { relativePath })).blog;
      if (!original || !BLOG_KEYS.every(key => Object.prototype.hasOwnProperty.call(original, key))) throw new Error("Incomplete article data. Update cancelled.");
      if (!["title", "description", "date"].every(key => typeof original[key] === "string" && original[key].trim().length > 0)) throw new Error("Required article fields missing. Update cancelled.");
      if (!original.body || original.body.type !== "root" || !Array.isArray(original.body.children)) throw new Error("Article body unavailable. Update cancelled.");
      const params = Object.fromEntries(BLOG_KEYS.filter(key => original[key] !== null && original[key] !== undefined).map(key => [key, original[key]]));
      if (kind === "pin") params.sticky = sticky;
      else params.draft = true;
      const latest = (await request(readQuery, { relativePath })).blog;
      if (canonicalBlogValue(latest) !== canonicalBlogValue(original)) throw new Error("Article changed during update. Please try again.");
      await request(`mutation SaveCompleteBlog($relativePath: String!, $params: BlogMutation!) { updateBlog(relativePath: $relativePath, params: $params) { id } }`, { relativePath, params });
      const saved = (await request(readQuery, { relativePath })).blog;
      const expected = { ...original, ...(kind === "pin" ? { sticky } : { draft: true }) };
      if (!saved || canonicalBlogValue(saved) !== canonicalBlogValue(expected)) throw new Error("Saved article verification failed. Check GitHub before making further changes.");
    } finally {
      activeMutations.delete(relativePath);
    }
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
