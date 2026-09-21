# pi-toolcall

A [pi](https://github.com/earendil-works/pi) extension that removes noise from
shell tool call blocks.

## What it does

pi's default bash renderer decorates every tool call with a `(timeout Ns)`
suffix, a blank line, an output preview, `... earlier lines` / `[Truncated]`
hints, and a trailing `Took Ns` footer.

`toolcall` collapses each call to just the `$ command` line:

- **Collapsed:** only the `$ command` line, or `✗ failed (ctrl+o to expand)` on
  a non-zero exit
- **Expanded (`ctrl+o`):** the full output

Behaviour is unchanged; only the TUI presentation is cleaner.

## Enable per project

The extension lives at [`.pi/extensions/toolcall.ts`](.pi/extensions/toolcall.ts),
so it loads automatically for this project once the project is trusted. Run
`/reload` (or restart pi) to pick it up.

## Enable globally (all pi sessions)

Symlink it into your global extensions directory. This keeps the global copy in
sync with edits made in this repo:

```bash
mkdir -p ~/.pi/agent/extensions
ln -sf "$PWD/.pi/extensions/toolcall.ts" ~/.pi/agent/extensions/toolcall.ts
```

Then `/reload` or restart pi.

> If you move or delete this repo, the symlink breaks — re-point it or copy the
> file (`cp` instead of `ln -sf`) if you prefer an independent global copy.

## Test without installing

```bash
pi -e ./.pi/extensions/toolcall.ts
```
