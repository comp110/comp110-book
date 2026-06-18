.PHONY: sync serve build clean

sync:
	uv sync

serve:
	uv run python scripts/serve.py

build:
	uv run python -m zensical build

clean:
	rm -rf site
