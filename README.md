# Nextgen

A Zensical-based static documentation website managed with `uv`.

## Development

Open the folder in a devcontainer. The container installs Python 3.12 and `uv`, then runs:

```sh
uv sync
```

Preview the site:

```sh
make serve
```

Build the static site:

```sh
make build
```

The preview server is configured for `http://localhost:8000`, and the build output is written to `site/`. `make serve` runs Zensical's live preview behind a small header proxy, so live reload stays enabled while interactive C terminal examples get the cross-origin isolation headers they need.
