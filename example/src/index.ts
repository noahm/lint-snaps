export function main() {
  // error in editor unless ignored via a comment, not blocking in CI when ignored
  // eslint-disable-next-line no-bitwise
  let foo = 4 ^ 2;

  // warns in editor unless ignored via comment
  // doesn't error in CI because `lint-snaps/no-var.snap.json` accounts for this one case
  // eslint-disable-next-line no-var
  var bar = 1;

  // adding a second one here does cause a CI failure. above file doesn't allow for 2 warnings in this file
  // eslint-disable-next-line no-var
  var baz = 2;

  // error in editor unless ignored via comment. blocking in CI regardless of disable comment
  // eslint-disable-next-line no-eval
  // bar = eval("2");

  return foo + bar;
}
