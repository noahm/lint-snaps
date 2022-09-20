# lint-snaps

This repo is a working sample of how we at Twitch built a custom wrapper around linting tools like `eslint` to allow us to make incremental changes to lint rules in large projects. It builds on ideas like Jest's "snapshot tests" to create a snapshot file of known failures for individual lint rules.

Much like snapshot tests, the script's behavior hinges on whether it runs in update mode.

- In update mode, using the `-u` flag: It runs `eslint`, exiting non-zero on any error. If no errors are produced it collects all warnings and writes them out to JSON files on disk. One file per rule producing a warning, the contents of each file is an object with a key for each file containing a warning, and the corresponding value is the number of warnings that rule produced within that file.
- In its normal mode: It runs `eslint`, exiting non-zero on any error. If no errors are produced it compares the number of warnings produced by each rule in each file to the counts written to disk by the most recent use of update mode. If any file has _more warnings_ than last saved in the snapshot files on disk, it exits non-zero.

The ideas implemented here were originally described in [my 2021 post on the Twitch engineering blog](https://blog.twitch.tv/en/2021/09/07/guiding-a-monolith-with-a-gentle-touch-the-power-of-pairing-codeowners-and-lint-rules/#failure-snapshots).

This tool works best when paired with required reviewers and CODEOWNERS file delegating the contents of the `lint-snaps` folder to a core team responsible for the project as a whole. Individual contributors outside of the core team can open PRs, see a lint failure with a message to run `yarn lint-snaps -u` and commit the results. This will change the contents of the `lint-snaps` folder and trigger a review from the core team who then have an opportunity to either push back or allow an exception.

## Example

A working example of how this can be used in a project is included in the `example` folder. First install and build the outer project with `yarn && yarn build`, then `cd example && yarn`.

Assuming the `ci:lint` npm script is run as part of standard status checks on PRs to the project, the snap files in `lint-snaps` allow incremental application of lint rules on a per-file basis to push standards forward while allowing legacy code to remain undisturbed.
