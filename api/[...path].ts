import { fetch } from '../packages/backend/src/web.ts';

/** Vercel fetch web handler. Vercel only treats `{ fetch }` as a Web handler. */
export default { fetch };
