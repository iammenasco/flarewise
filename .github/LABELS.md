# Required GitHub labels

Create these labels on the public repo before using the submission pipeline:

| Label | Purpose |
|-------|---------|
| `new-food` | Applied by the in-app `/submit` issue link |
| `approved-food` | Maintainer-only gate that triggers ingest → `main` |

`approved-food` is the only human step after an issue is filed. The ingest
workflow runs the same checks as CI, then commits and closes the issue.
