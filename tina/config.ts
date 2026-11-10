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
          name: 'project',
          label: 'Portfolio',
          path: 'src/content/projects',
          format: 'md',

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
            label: "鬮ｫ・ｴ鬲・ｼ夲ｽｽ・ｽ繝ｻ・･鬮ｫ・ｴ陝ｷ・｢繝ｻ・ｽ繝ｻ・ｬ鬯ｮ・ｫ繝ｻ・ｱ髫ｶ謚ｵ・ｽ・ｭ驍ｵ・ｺ繝ｻ・｡鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢隴主・讓溘・蠑ｱ繝ｻ/ Japanese Title",
          },
          {
            type: "string",
            name: "japaneseDescription",
            label: "鬮ｫ・ｴ鬲・ｼ夲ｽｽ・ｽ繝ｻ・･鬮ｫ・ｴ陝ｷ・｢繝ｻ・ｽ繝ｻ・ｬ鬯ｮ・ｫ繝ｻ・ｱ髫ｶ螢ｹ繝ｻ繝ｻ・ｽ繝ｻ・ｪ郢晢ｽｻ繝ｻ・ｬ鬮ｫ・ｴ闕ｳ讒ｫ蠕宣垓・ｫ郢晢ｽｻ/ Japanese Description",
            ui: { component: "textarea" },
          },
          {
            type: "string",
            name: "japaneseBody",
            label: "鬮ｫ・ｴ鬲・ｼ夲ｽｽ・ｽ繝ｻ・･鬮ｫ・ｴ陝ｷ・｢繝ｻ・ｽ繝ｻ・ｬ鬯ｮ・ｫ繝ｻ・ｱ髫ｶ鬥ｴ・ｰ莉｣笳・ｫｫ・ｴ遶丞｣ｹ繝ｻ/ Japanese Body (鬮ｫ・ｰ繝ｻ・ｾ郢晢ｽｻ繝ｻ・ｹ鬯ｮ・ｯ繝ｻ・ｦ髫ｰ逍ｲ・ｻ繧托ｽｽ・ｽ繝ｻ・ｯ郢晢ｽｻ繝ｻ・ｾ鬮ｯ貊ゑｽｽ・｢驛｢譎｢・ｽ・ｻ",
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


