import { handlers } from '@/auth';

/** Requis pour que `authorize` fasse des requêtes HTTP sortantes (Axios) vers Nest. */
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
