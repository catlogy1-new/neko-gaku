// @ts-nocheck (generated types/client appear after your first tinacms dev run)
import { requestWithMetadata } from '@tinacms/astro/data';
import client from '../../../tina/__generated__/client';

export const getPost = (slug: string) =>
  requestWithMetadata(client.queries.blog({ relativePath: slug + '.md' }), {
    priority: 'primary',
  });

export const getPhotography = () =>
  requestWithMetadata(
    client.queries.project({
      relativePath: 'Photography.md',
    }),
    {
      priority: 'primary',
    },
  );

export const getMedia = (relativePath: string) =>
  requestWithMetadata(
    client.queries.media({ relativePath }),
    { priority: 'primary' },
  );

export const getPulse = (relativePath: string) =>
  requestWithMetadata(
    client.queries.pulse({ relativePath }),
    { priority: 'primary' },
  );
