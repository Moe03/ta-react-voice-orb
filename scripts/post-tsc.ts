import * as fs from "fs/promises";
import * as path from "path";

/**
 * Deletes all files and folders inside `rootPath` except for those
 * whose relative paths (from rootPath) appear in the `exceptions` array.
 *
 * @param rootPath - The directory to process.
 * @param exceptions - An array of paths (relative to rootPath) to keep.
 */
async function deleteAllExcept(
  rootPath: string,
  exceptions: string[]
): Promise<void> {
  // Normalize exception paths for consistent matching.
  const exceptionsSet = new Set(exceptions.map((e) => path.normalize(e)));

  /**
   * Recursively processes the directory at `currentPath`.
   *
   * @param currentPath - Absolute path of the current directory.
   * @param relativePath - The path relative to the original rootPath.
   */
  async function processDirectory(
    currentPath: string,
    relativePath: string
  ): Promise<void> {
    // Read the directory entries.
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      // Build the relative path for the item.
      const itemRelPath = relativePath ? path.join(relativePath, item) : item;
      const fullItemPath = path.join(currentPath, item);

      // If the item is in the exceptions list, skip processing it.
      if (exceptionsSet.has(path.normalize(itemRelPath))) {
        // Do not process inside an exception folder (or delete an exception file).
        continue;
      }

      const stats = await fs.lstat(fullItemPath);
      if (stats.isDirectory()) {
        // Process the contents of the directory.
        await processDirectory(fullItemPath, itemRelPath);
        // After processing, check if the directory is now empty.
        const remaining = await fs.readdir(fullItemPath);
        if (remaining.length === 0) {
          await fs.rmdir(fullItemPath);
        }
      } else {
        // Delete the file.
        await fs.unlink(fullItemPath);
      }
    }
  }

  // Process the root directory but never remove the root itself.
  await processDirectory(rootPath, "");
}

// --- Example usage ---
// This call will delete everything under './dist/vg-docker/src'
// except for the folder "+global_consts" and any file/folder whose
// relative path matches one of the entries in the exceptions array.
deleteAllExcept("./dist", [
  "vg-docker/src/+global_consts/client.js",
  "vg-docker/src/+global_consts/client.d.ts",
  "src/app/Types",
  "src/app/Types",
  "bun-server",
  "src/public_packages/web-call",
  "src/public_packages/react-voice-orb",
]).catch(console.error);
