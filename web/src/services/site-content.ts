import request from '@/utils/request';

export type SiteContentConfig = any;

export const SiteContentApi = {
  getPublic: () => request.get('/site-content/public'),
  getAdmin: () => request.get('/site-content'),
  update: (content: SiteContentConfig) => request.put('/site-content', { content }),
};

