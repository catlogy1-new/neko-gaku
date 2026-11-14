import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  // Uncomment to allow cross-origin requests from non-localhost origins
  // during local development (e.g. GitHub Codespaces, Gitpod, Docker).
  // Use 'private' to allow all private-network IPs (WSL2, Docker, etc.)
  // server: {
  //   allowedOrigins: ['https://your-codespace.github.dev'],
  // },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/r/content-modelling-collections/
  schema: {
    collections: [
    {
      name: "about",
      label: "About",
      path: "src/content",
      format: "mdx",
      match: {
        include: "about",
      },
      ui: {
        allowedActions: {
          create: false,
          delete: false,
          createNestedFolder: false,
        },
      },
      fields: [
        {
          type: "string",
          name: "profileLead",
          label: "PROFILE - Introduction",
          ui: { component: "textarea" },
        },
        {
          type: "string",
          name: "profileEnglish",
          label: "PROFILE - English",
          ui: { component: "textarea" },
        },
        {
          type: "string",
          name: "profileJapanese",
          label: "PROFILE - Japanese",
          ui: { component: "textarea" },
        },
        {
          type: "string",
          name: "profileName",
          label: "PROFILE - Name",
        },
        {
          type: "string",
          name: "profileAlias",
          label: "PROFILE - Alias",
        },
        {
          type: "string",
          name: "profileField",
          label: "PROFILE - Field",
        },
        {
          type: "string",
          name: "profileLocation",
          label: "PROFILE - Location",
        },
        {
          type: "string",
          name: "profileStatus",
          label: "PROFILE - Status",
        },
        {
          type: "string",
          name: "statementEnglish",
          label: "STATEMENT - English paragraphs",
          ui: { component: "textarea" },
        },
        {
          type: "string",
          name: "statementJapanese",
          label: "STATEMENT - Japanese paragraphs",
          ui: { component: "textarea" },
        },
        {
          type: "string",
          name: "title",
          label: "Title",
          isTitle: true,
          required: true,
        },
        {
          type: "string",
          name: "description",
          label: "Description",
        },
        {
          type: "string",
          name: "date",
          label: "Date",
        },
        {
          type: "rich-text",
          name: "body",
          label: "About Body",
          isBody: true,
        },
      ],
    },
      {
        name: "pulse",
        ui: {
          router: async ({ document }) => {
            const relativePath = document._sys.relativePath;
            if (!/^[a-zA-Z0-9_-]+\.mdx$/.test(relativePath)) return undefined;

            const marker = '/tina-island/pulse-body?' +
              new URLSearchParams({ path: relativePath }).toString();

            const pending = ['/vibe/'];
            const visited = new Set<string>();

            try {
              while (pending.length > 0 && visited.size < 100) {
                const route = pending.shift()!;
                if (visited.has(route)) continue;
                visited.add(route);

                const response = await fetch(route, { cache: 'no-store' });
                if (!response.ok) continue;

                const html = await response.text();
                const page = new DOMParser().parseFromString(html, 'text/html');

                const found = Array.from(
                  page.querySelectorAll('[data-tina-island]')
                ).some(
                  element => element.getAttribute('data-tina-island') === marker
                );

                if (found) return route;

                for (const link of Array.from(page.querySelectorAll('a[href]'))) {
                  const href = link.getAttribute('href') ?? '';
                  if (/^\/vibe\/page\/\d+\/?$/.test(href)) {
                    const next = href.replace(/\/$/, '') + '/';
                    if (!visited.has(next) && !pending.includes(next)) {
                      pending.push(next);
                    }
                  }
                }
              }
            } catch {
              return undefined;
            }

            return undefined;
          },
        },
        label: "Pulse",
        path: "src/content/vibe",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Updated Date",
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
          },
          {
            type: "string",
            name: "type",
            label: "Type",
            options: ["text", "photo", "quote", "code", "mixed"],
          },
          {
            type: "string",
            name: "mood",
            label: "Mood",
          },
          {
            type: "string",
            name: "location",
            label: "Location",
          },
          {
            type: "image",
            name: "images",
            label: "Images",
            list: true,
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "string",
            name: "align",
            label: "Alignment",
            options: ["left", "right", "center"],
          },
          {
            type: "string",
            name: "size",
            label: "Size",
            options: ["sm", "md", "lg"],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Pulse Body",
            isBody: true,
          },
        ],
      },
      {
        name: "media",
        label: "Media",
        path: "src/content/media",
        format: "mdx",
        ui: {
          router: async ({ document }) => {
            const relativePath = document._sys.relativePath;
            if (!/^[a-zA-Z0-9_-]+\.mdx$/.test(relativePath)) return undefined;

            const marker = '/tina-island/media-card?' +
              new URLSearchParams({ path: relativePath }).toString();

            const pending = ['/media/'];
            const visited = new Set<string>();

            try {
              while (pending.length > 0 && visited.size < 100) {
                const route = pending.shift()!;
                if (visited.has(route)) continue;
                visited.add(route);

                const response = await fetch(route, { cache: 'no-store' });
                if (!response.ok) continue;

                const html = await response.text();
                const page = new DOMParser().parseFromString(html, 'text/html');

                const found = Array.from(
                  page.querySelectorAll('[data-tina-island]')
                ).some(
                  element => element.getAttribute('data-tina-island') === marker
                );

                if (found) return route;

                for (const link of Array.from(page.querySelectorAll('a[href]'))) {
                  const href = link.getAttribute('href') ?? '';
                  if (/^\/media\/(books|films|music)\/\d+\/?$/.test(href)) {
                    const next = href.replace(/\/$/, '') + '/';
                    if (!visited.has(next) && !pending.includes(next)) {
                      pending.push(next);
                    }
                  }
                }
              }
            } catch {
              return undefined;
            }

            return undefined;
          },
          allowedActions: {
            create: true,
            delete: true,
            createNestedFolder: false,
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
          },
          {
            type: "string",
            name: "creator",
            label: "Creator",
            required: true,
          },
          {
            type: "string",
            name: "type",
            label: "Media Type",
            required: true,
            options: ["book", "film", "series", "album", "podcast"],
          },
          {
            type: "string",
            name: "status",
            label: "Status",
            options: ["completed", "in-progress", "planned", "abandoned"],
          },
          {
            type: "datetime",
            name: "completedAt",
            label: "Completed At",
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
          },
          {
            type: "image",
            name: "cover",
            label: "Cover",
          },
          {
            type: "string",
            name: "coverAspect",
            label: "Cover Aspect",
            options: ["portrait", "landscape", "square", "wide"],
          },
          {
            type: "number",
            name: "rating",
            label: "Rating",
          },
          {
            type: "boolean",
            name: "review",
            label: "Review",
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "string",
            name: "externalUrl",
            label: "External URL",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Review Body",
            isBody: true,
          },
        ],
      },
        {
          name: 'project',
          label: 'Portfolio',
          path: 'src/content/projects',
          format: 'md',

          ui: {
            router: async ({ document }) => {
              const relativePath = document._sys.relativePath;

              if (relativePath !== 'Photography.md') {
                return undefined;
              }

              const route = '/projects/';

              try {
                const response = await fetch(route, {
                  cache: 'no-store',
                });

                if (!response.ok) {
                  return undefined;
                }

                const html = await response.text();

                const page = new DOMParser().parseFromString(
                  html,
                  'text/html',
                );

                const marker = '/tina-island/portfolio-gallery';

                const hasPortfolioIsland = Array.from(
                  page.querySelectorAll('[data-tina-island]'),
                ).some(
                  (element) =>
                    element.getAttribute('data-tina-island') === marker,
                );

                return hasPortfolioIsland ? route : undefined;
              } catch {
                return undefined;
              }
            },
          },

          fields: [
            {
              type: 'string',
              name: 'title',
              label: 'Title',
              isTitle: true,
              required: true,
            },

            {
              type: 'string',
              name: 'description',
              label: 'Description',
              required: true,
              ui: {
                component: 'textarea',
              },
            },

            {
              type: 'datetime',
              name: 'date',
              label: 'Date',
              required: true,
            },

            {
              type: 'boolean',
              name: 'draft',
              label: 'Draft',
            },

            {
              type: 'image',
              name: 'heroImage',
              label: 'Hero Image',
            },

            {
              type: 'object',
              name: 'galleryImages',
              label: 'Gallery Images',
              list: true,
              ui: {
                itemProps: (item) => ({
                  label: item?.title || 'Gallery Image',
                }),
              },
              fields: [
                {
                  type: 'image',
                  name: 'src',
                  label: 'Image',
                  required: true,
                },
                {
                  type: 'string',
                  name: 'title',
                  label: 'Title',
                },
                {
                  type: 'string',
                  name: 'alt',
                  label: 'Alt Text',
                },
              ],
            },

            {
              type: 'object',
              name: 'photographyNote',
              label: 'Photography / Text Below Gallery',
              fields: [
                { type: 'string', name: 'index', label: 'Index' },
                { type: 'string', name: 'year', label: 'Year' },
                { type: 'string', name: 'kicker', label: 'Small Heading' },
                { type: 'string', name: 'title', label: 'Text Title' },
                {
                  type: 'string',
                  name: 'paragraphs',
                  label: 'Paragraphs',
                  list: true,
                  ui: { component: 'textarea' },
                },
                { type: 'string', name: 'status', label: 'Footer Text' },
              ],
            },
            {
              type: 'boolean',
              name: 'showHeroImage',
              label: 'Show Hero Image',
            },

            {
              type: 'string',
              name: 'tags',
              label: 'Tags',
              list: true,
            },

            {
              type: 'string',
              name: 'categories',
              label: 'Categories',
              list: true,
            },

            {
              type: 'string',
              name: 'series',
              label: 'Series',
              list: true,
            },

            {
              type: 'boolean',
              name: 'comments',
              label: 'Comments',
            },

            {
              type: 'string',
              name: 'icon',
              label: 'Portfolio Icon',
              options: [
                'github',
                'box',
                'code-2',
                'database',
                'file-code-2',
                'globe-2',
                'layers-3',
                'palette',
                'rocket',
                'sparkles',
                'terminal',
                'wand-sparkles',
              ],
            },

            {
              type: 'string',
              name: 'iconColor',
              label: 'Icon Color',
              description: 'Example: #b7ff00',
            },

            {
              type: 'object',
              name: 'authors',
              label: 'Authors',
              list: true,
              fields: [
                {
                  type: 'string',
                  name: 'name',
                  label: 'Name',
                  required: true,
                },
                {
                  type: 'string',
                  name: 'url',
                  label: 'URL',
                },
              ],
            },

            {
              type: 'object',
              name: 'links',
              label: 'External Links',
              list: true,
              fields: [
                {
                  type: 'string',
                  name: 'label',
                  label: 'Label',
                  required: true,
                },
                {
                  type: 'string',
                  name: 'href',
                  label: 'URL',
                  required: true,
                },
                {
                  type: 'string',
                  name: 'kind',
                  label: 'Type',
                  options: [
                    'github',
                    'website',
                    'platform',
                    'docs',
                    'demo',
                  ],
                },
              ],
            },

            {
              type: 'object',
              name: 'sidebar',
              label: 'Sidebar',
              fields: [
                {
                  type: 'boolean',
                  name: 'enable',
                  label: 'Enable Sidebar',
                },
                {
                  type: 'boolean',
                  name: 'toc',
                  label: 'Table of Contents',
                },
                {
                  type: 'boolean',
                  name: 'relatedPosts',
                  label: 'Related Posts',
                },
              ],
            },

            {
              type: 'rich-text',
              name: 'body',
              label: 'Portfolio Body',
              isBody: true,
            },
          ],
        },

      // NEXUS_TINA_BLOG_MD_SAFE_V2
      {
        name: "blog",
        label: "Blog",
        path: "src/content/blog",
        format: "md",
        match: {
          include: "*",
        },
        ui: {
          router: async ({ document }) => {
            const relativePath = document._sys.relativePath;
            const match = /^([a-zA-Z0-9_-]+)\.md$/.exec(relativePath);

            if (!match) {
              return undefined;
            }

            const slug = match[1];
            const route = `/blog/${slug}/`;

            try {
              const response = await fetch(route, {
                cache: "no-store",
              });

              if (!response.ok) {
                return undefined;
              }

              const html = await response.text();
              const page = new DOMParser().parseFromString(
                html,
                "text/html",
              );

              const marker = `/tina-island/blog-body?slug=${slug}`;

              const hasBlogIsland = Array.from(
                page.querySelectorAll("[data-tina-island]"),
              ).some(
                (element) =>
                  element.getAttribute("data-tina-island") === marker,
              );

              return hasBlogIsland ? route : undefined;
            } catch {
              return undefined;
            }
          },
          allowedActions: {
            create: false,
            delete: true,
            createNestedFolder: false,
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true,
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "date",
            label: "Date (YYYY-MM-DD)",
            required: true,
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "string",
            name: "categories",
            label: "Categories",
            list: true,
          },
          {
            type: "string",
            name: "series",
            label: "Series",
            list: true,
          },
          {
            type: "boolean",
            name: "comments",
            label: "Comments",
          },
          {
            type: "boolean",
            name: "sticky",
            label: "Sticky",
          },
          {
            type: "string",
            name: "heroImage",
            label: "Hero Image Path",
          },
          {
            type: "boolean",
            name: "showHeroImage",
            label: "Show Hero Image",
          },
          {
            type: "string",
            name: "japaneseUrl",
            label: "Japanese URL",
          },
          {
            type: "string",
            name: "japaneseTitle",
            label: "日本語タイトル / Japanese Title",
          },
          {
            type: "string",
            name: "japaneseDescription",
            label: "日本語の説明 / Japanese Description",
            ui: { component: "textarea" },
          },
          {
            type: "string",
            name: "japaneseBody",
            label: "日本語本文 / Japanese Body",
            ui: { component: "textarea" },
          },
          {
            type: "object",
            name: "sidebar",
            label: "Sidebar",
            fields: [
              {
                type: "boolean",
                name: "enable",
                label: "Enable",
              },
              {
                type: "boolean",
                name: "toc",
                label: "Table of Contents",
              },
              {
                type: "boolean",
                name: "relatedPosts",
                label: "Related Posts",
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Article Body",
            isBody: true,
            parser: {
              type: "markdown",
            },
          },
        ],
      },
    ],
  },
});
