/**
 * This config file provides rules that cannot be ignored with inline comments in the
 * usual way.
 *
 * Rules configured with warnings here are incrementally applied to the project. New code
 * must not add new warnings but "known" warnings in existing code are recorded on disk
 * in snapshot files (*.snap.json) and allowed to remain as-is. On disk snapshot files are
 * updated with `yarn lint-snaps -u`
 *
 * Rules configured with errors are simply un-ignorable failure cases. No allow-listing or
 * inline comment directives can avoid a failure case.
 */
module.exports = {
  extends: ["./.eslintrc-base.js"],
  rules: {
    // Nobody gets to use eval. Even if they try to `//eslint-ignore` it will still fail in CI
    "no-eval": "error",
    // We want our code to use `const/let` but have older legacy files that don't have to be updated.
    // All uses of `var` keyword will have a lint warning, and all that aren't accounted for within
    // the snap file on disk will produce failures in CI.
    "no-var": "warn",
  },
};
