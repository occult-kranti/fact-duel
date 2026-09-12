# Source import and original history

This repository contains all 191 tracked files from FACT//DUEL v6, imported through the GitHub connection. The original seven-commit Git history is preserved exactly in `source-history.bundle`. GitHub main begins with its repository initialization and a complete source import; its commit IDs differ from the source repository.

Original source HEAD: `074ab9b9fffa7e92ce7bcdd08b16344b744b3bdb`.

`source-manifest.json` records every original path, mode, byte count and Git blob SHA. The source, artwork, question bank, research reports, roadmap, migrations, lockfile and tests are included unchanged. Machine-local dependencies, generated build output, transient credentials and browser-local player records are not source files.

To restore the original repository history in a separate folder:

```sh
git clone archive/source-history.bundle fact-duel-source-history
cd fact-duel-source-history
git log --oneline --all
```

The bundle has no prerequisites and includes the original main branch and HEAD. It does not include repository credentials or local configuration. Existing third-party license notices remain in the source; this import grants no new license.

Hosted private game: https://fact-duel-online.whatswrong-inc.chatgpt.site

Current source verification: 68 tests, TypeScript and production build passed before the v6 Site release. The import does not constitute a new browser or WAN test.
