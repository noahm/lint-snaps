/**
 * This default named config is used by the lint plugins for editors like VS Code.
 * By extending the "snaps config" we make those errors appear in editor along with
 * any softer, ignorable rules configured directly here.
 */
module.exports = {
  extends: ["./.eslintrc-base.js", "./.eslintrc-snaps.js"],
  rules: {
    // developers are discouraged from bitwise ops but can locally ignore using their own judgement
    "no-bitwise": "error",
  },
};
