# Merge Conflict Resolution Guide

If your local branch reports merge conflicts, use this sequence:

```bash
git fetch origin
git checkout work
git merge origin/main
```

If conflicts exist, list unresolved files:

```bash
git status --short
```

Open each conflicted file and remove conflict markers:

- `<<<<<<<`
- `=======`
- `>>>>>>>`

Then validate no markers remain:

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)"
```

Finalize the merge:

```bash
git add .
git commit -m "Resolve merge conflicts with main"
```

## Project-specific hotspots

In this repository, merge conflicts are most likely in:

- `README.md`
- `app/dashboard/pools/[poolId]/history/page.tsx`
- `app/api/**` route handlers
- `prisma/schema.prisma` and `prisma/migrations/**`

When `prisma/schema.prisma` and migration SQL both changed, keep schema and SQL aligned by re-running migration generation in a clean environment before pushing.
