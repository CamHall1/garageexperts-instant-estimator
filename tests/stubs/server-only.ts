// no-op stub: the real "server-only" package throws unconditionally
// outside Next's webpack/turbopack build (it relies on bundler-specific
// resolve conditions to distinguish client vs. server bundles), which
// breaks plain Node/Vitest test runs. Alias it to this file in
// vitest.config.mts.
export {};
