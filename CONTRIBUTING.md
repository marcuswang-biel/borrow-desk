# Contributing

Do not commit `.env`, `.env.development`, or `.env.production`.

Run `pnpm test` before opening a pull request. Domain failures stay tagged errors on the Effect error channel. New tables and column changes go in `packages/backend/src/sql/migrations` as the next `<YYYYMMDDNN>_<name>.ts` file. `NN` is a two-digit sequence for that day.

GitHub writes for this repository use the work account `marcus.wang@bielcrystal.com.hk`.
