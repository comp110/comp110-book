from __future__ import annotations

import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def unused_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def wait_for_headers(url: str) -> urllib.request.HTTPMessage:
    deadline = time.monotonic() + 30
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        try:
            request = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(request, timeout=1) as response:
                return response.headers
        except Exception as error:  # noqa: BLE001 - surface the final connection error.
            last_error = error
            time.sleep(0.2)

    raise AssertionError(f"Timed out waiting for {url}: {last_error}")


def test_serve_script_sets_cross_origin_isolation_headers() -> None:
    port = unused_port()
    process = subprocess.Popen(
        [
            sys.executable,
            "scripts/serve.py",
            "--dev-addr",
            f"127.0.0.1:{port}",
        ],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    try:
        headers = wait_for_headers(f"http://127.0.0.1:{port}/c-terminal-runner/")
        assert headers["Cross-Origin-Opener-Policy"] == "same-origin"
        assert headers["Cross-Origin-Embedder-Policy"] == "credentialless"
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)
