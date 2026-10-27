# Bundle the API function from built packages

Vercel's plain `api` directory matches only one dynamic segment. `vercel.json` therefore rewrites every `/api` request to `api/[...path].ts`, and that file exports the Web Handler shape `{ fetch }`. A bare default function is treated as a Node handler and its returned `Response` is not sent.

The shared `packages/api` package emits JavaScript for the function. `tsconfig.build.json` turns off declaration-only emit and rewrites relative `.ts` imports, while `exports` points at `build/index.js` and its declarations. The function resolves the built package instead of TypeScript source. Migrations are static imports, so the function does not read a migrations directory at runtime.

Because the built package and the migrations are traced from the function entry, `functions.includeFiles` is no longer needed and the earlier `packages/**` glob is removed. `pnpm dev` and `pnpm test` build the API package first because Node and Vitest resolve the same built entry.
