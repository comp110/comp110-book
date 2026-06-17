.PHONY: sync serve build clean

sync:
	uv sync

serve:
	uv run python -m zensical serve

build:
	uv run python -m zensical build

clean:
	rm -rf site
