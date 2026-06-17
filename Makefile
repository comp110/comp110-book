.PHONY: sync serve build clean

sync:
	uv sync

serve:
	uv run zensical serve

build:
	uv run zensical build

clean:
	rm -rf site
