// Checks this project's documented BEM flex structure, not arbitrary BEM projects.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../src/blocks");
const name = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";
const bem = new RegExp(
  `^${name}(?:__${name})?(?:_${name}(?:_${name}|_[0-9]+)?)?$`,
);
let files = 0,
  selectors = 0;
for (const block of fs.readdirSync(root)) {
  assert.match(block, new RegExp(`^${name}$`));
  for (const file of fs.readdirSync(path.join(root, block))) {
    assert.ok(
      [`${block}.tsx`, `${block}.css`].includes(file),
      `Unexpected file: ${block}/${file}`,
    );
    files++;
    if (!file.endsWith(".css")) continue;
    const css = fs.readFileSync(path.join(root, block, file), "utf8");
    // Rules contain declarations and media queries, but no nested CSS selectors.
    for (const match of css.matchAll(/([^{}]+)\{/g)) {
      const rule = match[1].trim();
      if (rule.startsWith("@")) continue;
      for (const selector of rule.split(",")) {
        const trimmed = selector.trim();
        const base = trimmed
          .replace(/\[[^\]]+\]/g, "")
          .replace(/:{1,2}[a-z-]+(?:\([^)]*\))?/g, "");
        assert.ok(base.startsWith("."), `Tag or compound selector: ${trimmed}`);
        const cls = base.slice(1);
        assert.match(cls, bem, `Invalid BEM selector: ${trimmed}`);
        assert.equal(
          cls.split("__")[0].split("_")[0],
          block,
          `Foreign block in ${file}: ${cls}`,
        );
        selectors++;
      }
    }
  }
}
assert.ok(!fs.existsSync(path.resolve(root, "../styles/global.css")));
console.log(`PASS BEM flex: ${files} files, ${selectors} class selectors`);
