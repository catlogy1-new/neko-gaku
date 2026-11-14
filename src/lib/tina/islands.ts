// @ts-nocheck (generated types/client appear after your first tinacms dev run)
import type { IslandRegistry } from '@tinacms/astro/experimental';
import type { QueryResult } from '@tinacms/astro/data';
import type { BlogQuery, ProjectQuery, MediaQuery, PulseQuery } from '../../../tina/__generated__/types';
import PostBody from '../../components/tina/PostBody.astro';
import BlogBody from '../../components/tina/BlogBody.astro';
import PortfolioGallery from '../../components/tina/PortfolioGallery.astro';
import MediaCard from '../../components/tina/MediaCard.astro';
import PulseEntry from '../../components/tina/PulseEntry.astro';
import { getPost, getPhotography, getMedia, getPulse } from './data';

export const islands: IslandRegistry = {
  'media-card': {
    fetch: (_request, params) => getMedia(params.get('path') ?? ''),
    component: MediaCard,
    wrapper: { tag: 'div' },
    propsFromData: (data) => ({
      data: (data as QueryResult<MediaQuery>).data?.media,
    }),
  },
  'pulse-body': {
    fetch: (_request, params) => getPulse(params.get('path') ?? ''),
    component: PulseEntry,
    wrapper: { tag: 'div' },
    propsFromData: (data) => ({
      data: (data as QueryResult<PulseQuery>).data?.pulse,
    }),
  },
  'portfolio-gallery': {
    fetch: () => getPhotography(),
    component: PortfolioGallery,
    wrapper: { tag: 'div' },
    propsFromData: (data) => ({
      data: (data as QueryResult<ProjectQuery>).data?.project,
    }),
  },
  'blog-body': {
    fetch: (_request, params) => getPost(params.get('slug') ?? ''),
    component: BlogBody,
    wrapper: { tag: 'div' },
    propsFromData: (data) => ({
      data: (data as QueryResult<BlogQuery>).data?.blog,
    }),
  },
  post: {
    fetch: (_request, params) => getPost(params.get('slug') ?? 'hello-world'),
    component: PostBody,
    wrapper: { tag: 'article' },
    propsFromData: (data) => ({
      data: (data as QueryResult<BlogQuery>).data?.blog,
    }),
  },
};
