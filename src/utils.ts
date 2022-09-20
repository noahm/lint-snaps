import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";

export const logger = {
  info(msg: any) {
    console.info(msg);
  },
  debug(msg: any) {
    console.debug(msg);
  },
  error(msg: any) {
    process.exitCode = 1;
    console.error(msg);
  },
};

/**
 * 2-level map of lint errors.
 * First by lint rule name, second by file.
 *
 * @example failureMap['no-legacy-api']['src/common/legacy-api.ts']
 * // gives the number of lint warnings for that rule in that file
 */
export interface WarningMaps {
  [lintRule: string]: { [fileName: string]: number };
}

function getSnapshotFileName(lintName: string) {
  // turn slashes and whitespace into hyphens
  return `${lintName.replace(/[/\\\s]+/g, "-")}.snap.json`;
}

function getSnapshotPath(snapshotDir: string, lintName: string) {
  return `${snapshotDir}/${getSnapshotFileName(lintName)}`;
}

export interface ComparisonSuccess {
  type: "success";
  /**
   * List of tuples containing lint rule and file name that had their baseline updated
   */
  updatedFiles: Array<[string, string]>;
}

export interface ComparisonFailure {
  type: "failure";
  /**
   * List of tuples containing lint rule name to file name with MORE warnings than baseline
   */
  failedRules: Array<[string, string]>;
}

export function compareLintToSnapshots(
  snapshotDir: string,
  failureMap: WarningMaps,
  update = false
): ComparisonFailure | ComparisonSuccess {
  if (mkdirSync(snapshotDir, { recursive: true })) {
    logger.info(
      `${snapshotDir} is missing. Will create and run in update mode.`
    );
    update = true;
  }

  const success: ComparisonSuccess = {
    type: "success",
    updatedFiles: [],
  };
  const failure: ComparisonFailure = {
    type: "failure",
    failedRules: [],
  };

  /**
   * All maps on disk are possibly stale now, meaning the codebase
   * may no longer have any failures for a given rule
   */
  const staleFailureMaps = new Set<string>();
  for (const filename of readdirSync(snapshotDir)) {
    if (filename.match(/\.map\.json$/)) {
      staleFailureMaps.add(filename);
    }
  }

  for (const ruleName of Object.keys(failureMap)) {
    // This map is not stale since we still have failures to update it with
    staleFailureMaps.delete(getSnapshotFileName(ruleName));

    const newFailureMap = failureMap[ruleName] || {};
    const snapshotFile = getSnapshotPath(snapshotDir, ruleName);

    const baselineFailureMap = existsSync(snapshotFile)
      ? JSON.parse(readFileSync(snapshotFile).toString())
      : {};

    for (const file of Object.keys(newFailureMap)) {
      const newFailureCount: number = newFailureMap[file];
      const baselineFailureCount: number = baselineFailureMap[file] || 0;
      if (newFailureCount > baselineFailureCount) {
        if (!update) {
          failure.failedRules.push([ruleName, file]);
        }
      }

      if (newFailureCount !== baselineFailureCount && update) {
        success.updatedFiles.push([ruleName, file]);
      }
    }

    if (update) {
      writeFileSync(snapshotFile, JSON.stringify(newFailureMap, null, 2));
    }
  }

  if (update) {
    for (const staleSnapshotFile of staleFailureMaps) {
      // Delete files where no failures were reported
      unlinkSync(`${snapshotDir}/${staleSnapshotFile}`);
    }
  }

  if (failure.failedRules.length) {
    return failure;
  }
  return success;
}
