import path from "path";
import chalk from "chalk";
import yargs from "yargs";
import { ESLint, Linter } from "eslint";
import { compareLintToSnapshots, logger, WarningMaps } from "./utils";

yargs(process.argv.slice(2))
  .scriptName("lint-snaps")
  .command(
    "*",
    "Check for and report unexpected lint failures OR write all current failures to snapshot files",
    {
      update: {
        type: "boolean",
        default: false,
        alias: "u",
        description: "Write out new snapshots including all failures",
      },
      config: {
        type: "string",
        demandOption: "Must provide a eslint config file",
        alias: "c",
        description: "Path to a eslint config file",
      },
      outDir: {
        type: "string",
        default: "lint-snaps",
        alias: "o",
        description: "Path to snapshot files on disk",
      },
      glob: {
        type: "string",
        default: "src/**/*.{ts?(x),d.ts,js}",
        description: "Glob matching files to lint",
      },
    },
    async (argv) => {
      let baseConfig: Linter.Config;
      try {
        baseConfig = require(path.resolve(argv.config));
      } catch (e) {
        logger.error("Failed to load provided eslint config file");
        logger.error(e);
        return;
      }

      const eslint = new ESLint({
        // use this config only
        baseConfig,
        // don't auto-load .eslintrc files
        useEslintrc: false,
        // don't allow inline comments to disable failures
        allowInlineConfig: false,
      });

      const results = await eslint.lintFiles(argv.glob);

      logger.debug(`lint finished, ${results.length} results reported`);

      const { warnings, errorFiles, errors } = formatResults(results);
      const result = compareLintToSnapshots(argv.outDir, warnings, argv.update);

      if (result.type === "success") {
        for (const [lintName, file] of result.updatedFiles) {
          logger.info(
            `Updated ${chalk.bold(
              lintName
            )} known lint warnings for ${chalk.bold(file)}`
          );
        }
      } else {
        for (const [lintName, file] of result.failedRules) {
          logger.error(
            `New ${chalk.bold(lintName)} lint warnings added in ${chalk.bold(
              file
            )}`
          );
        }
        logger.error(
          `Resolve the above by running: ${chalk.bold(`${argv.$0} -u`)}`
        );
      }

      if (errors.length) {
        for (const { file, rule } of errors) {
          logger.error(` - ${chalk.bold(chalk.red(rule))} ${chalk.dim(file)} `);
        }
        logger.error(
          `${chalk.red("Fatal:")} ${
            errors.length
          } lint error(s) exist across the above ${errorFiles.size} file(s)`
        );
        logger.error(
          "The rules violated have special treatment and cannot be ignored inline."
        );
      }
    }
  )
  .parse();

const WINDOWS_PATH = /\\/g;
const NORMAL_PATH = "/";

function formatResults(results: ESLint.LintResult[]) {
  const warningsByRule: WarningMaps = {};
  const errorFiles = new Set<string>();
  const errors = new Array<{ file: string; message: string; rule: string }>();

  for (const { filePath, messages, errorCount } of results) {
    if (!messages.length) {
      continue;
    }

    const filePathFixed = filePath
      .replace(process.cwd(), "")
      .replace(WINDOWS_PATH, NORMAL_PATH);

    if (errorCount) {
      errorFiles.add(filePathFixed);
    }

    for (const { ruleId, severity, message, line, column } of messages) {
      if (!ruleId) {
        continue;
      }
      if (severity === 2) {
        errors.push({
          file: filePath + `(${line},${column})`,
          message,
          rule: ruleId,
        });
        continue;
      }

      // lint warnings continue here
      if (!warningsByRule[ruleId]) {
        warningsByRule[ruleId] = {};
      }

      const ruleFailuresByFile = warningsByRule[ruleId];
      if (!ruleFailuresByFile[filePathFixed]) {
        ruleFailuresByFile[filePathFixed] = 1;
      } else {
        ruleFailuresByFile[filePathFixed] += 1;
      }
    }
  }

  return {
    warnings: warningsByRule,
    errorFiles,
    errors,
  };
}
