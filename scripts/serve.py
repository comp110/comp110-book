from __future__ import annotations

import argparse
import http.client
import http.server
import selectors
import signal
import socket
import subprocess
import sys
import time
import tomllib
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG_FILES = ("zensical.toml", "mkdocs.yml", "mkdocs.yaml")
ISOLATION_HEADERS = {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",
}
ISOLATION_HEADER_NAMES = {name.lower() for name in ISOLATION_HEADERS}
SKIPPED_RESPONSE_HEADERS = {
    "connection",
    "date",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "server",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}
SKIPPED_REQUEST_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}
upstream_process: subprocess.Popen[str] | None = None
proxy_server: http.server.ThreadingHTTPServer | None = None


class HeaderProxyHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.0"
    upstream_host = "127.0.0.1"
    upstream_port = 0

    def end_headers(self) -> None:
        for name, value in ISOLATION_HEADERS.items():
            self.send_header(name, value)
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        sys.stderr.write("%s - - [%s] %s\n" % (
            self.address_string(),
            self.log_date_time_string(),
            format % args,
        ))

    def do_GET(self) -> None:
        self.proxy_request()

    def do_HEAD(self) -> None:
        self.proxy_request()

    def do_POST(self) -> None:
        self.proxy_request()

    def do_PUT(self) -> None:
        self.proxy_request()

    def do_PATCH(self) -> None:
        self.proxy_request()

    def do_DELETE(self) -> None:
        self.proxy_request()

    def do_OPTIONS(self) -> None:
        self.proxy_request()

    def proxy_request(self) -> None:
        if self.headers.get("Upgrade", "").lower() == "websocket":
            self.tunnel_upgrade_request()
            return

        body = self.read_request_body()
        headers = self.forward_headers()
        connection = http.client.HTTPConnection(
            self.upstream_host,
            self.upstream_port,
            timeout=5,
        )

        try:
            connection.request(self.command, self.path, body=body, headers=headers)
            response = connection.getresponse()
            if connection.sock is not None:
                connection.sock.settimeout(None)
            self.send_response(response.status, response.reason)
            for name, value in response.getheaders():
                lower_name = name.lower()
                if lower_name in SKIPPED_RESPONSE_HEADERS or lower_name in ISOLATION_HEADER_NAMES:
                    continue
                self.send_header(name, value)
            self.end_headers()

            if self.command != "HEAD":
                while True:
                    chunk = response.read(64 * 1024)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    self.wfile.flush()
        except Exception as error:  # noqa: BLE001 - convert proxy failures into HTTP errors.
            self.send_error(502, f"Zensical live server is unavailable: {error}")
        finally:
            connection.close()

    def read_request_body(self) -> bytes | None:
        length = self.headers.get("Content-Length")
        if not length:
            return None
        try:
            size = int(length)
        except ValueError:
            return None
        return self.rfile.read(size) if size > 0 else None

    def forward_headers(self) -> dict[str, str]:
        headers: dict[str, str] = {}
        for name, value in self.headers.items():
            lower_name = name.lower()
            if lower_name in SKIPPED_REQUEST_HEADERS:
                continue
            headers[name] = value
        headers["Host"] = f"{self.upstream_host}:{self.upstream_port}"
        return headers

    def tunnel_upgrade_request(self) -> None:
        upstream = socket.create_connection((self.upstream_host, self.upstream_port), timeout=30)
        try:
            upstream.sendall(self.raw_upgrade_request())
            self.close_connection = True
            self.connection.setblocking(False)
            upstream.setblocking(False)

            selector = selectors.DefaultSelector()
            selector.register(self.connection, selectors.EVENT_READ, upstream)
            selector.register(upstream, selectors.EVENT_READ, self.connection)
            try:
                while True:
                    for key, _ in selector.select():
                        source = key.fileobj
                        target = key.data
                        data = source.recv(64 * 1024)
                        if not data:
                            return
                        target.sendall(data)
            finally:
                selector.close()
        finally:
            upstream.close()

    def raw_upgrade_request(self) -> bytes:
        request = [f"{self.command} {self.path} {self.request_version}\r\n"]
        saw_host = False
        for name, value in self.headers.items():
            if name.lower() == "host":
                value = f"{self.upstream_host}:{self.upstream_port}"
                saw_host = True
            request.append(f"{name}: {value}\r\n")
        if not saw_host:
            request.append(f"Host: {self.upstream_host}:{self.upstream_port}\r\n")
        request.append("\r\n")
        return "".join(request).encode("iso-8859-1")


def find_config_file() -> Path:
    for filename in DEFAULT_CONFIG_FILES:
        path = ROOT / filename
        if path.exists():
            return path
    raise SystemExit("No Zensical config file found.")


def configured_dev_addr(config_file: Path) -> str:
    if config_file.suffix != ".toml":
        return "127.0.0.1:8000"

    with config_file.open("rb") as file:
        config = tomllib.load(file)
    project = config.get("project", {})
    return str(project.get("dev_addr") or "127.0.0.1:8000")


def parse_dev_addr(value: str) -> tuple[str, int]:
    host, separator, port = value.rpartition(":")
    if not separator or not host or not port:
        raise SystemExit(f"Invalid dev address {value!r}; expected HOST:PORT.")
    try:
        return host, int(port)
    except ValueError as error:
        raise SystemExit(f"Invalid dev port in {value!r}.") from error


def unused_loopback_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def wait_for_upstream(port: int, process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 30
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise SystemExit(f"Zensical live server exited with code {process.returncode}.")
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.25):
                return
        except OSError as error:
            last_error = error
            time.sleep(0.1)

    raise SystemExit(f"Timed out waiting for Zensical live server: {last_error}")


def start_zensical(config_file: Path, port: int) -> subprocess.Popen[str]:
    return subprocess.Popen(
        [
            sys.executable,
            "-m",
            "zensical",
            "serve",
            "--config-file",
            str(config_file),
            "--dev-addr",
            f"127.0.0.1:{port}",
        ],
        cwd=ROOT,
        text=True,
    )


def terminate_upstream() -> None:
    global upstream_process
    process = upstream_process
    upstream_process = None
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)


def shutdown(signum: int | None = None, frame: object | None = None) -> None:  # noqa: ARG001
    terminate_upstream()
    if proxy_server is not None:
        proxy_server.server_close()
    raise SystemExit(0)


def serve_proxy(host: str, port: int, upstream_port: int, *, open_browser: bool = False) -> None:
    global proxy_server

    handler_class = type(
        "ConfiguredHeaderProxyHandler",
        (HeaderProxyHandler,),
        {"upstream_host": "127.0.0.1", "upstream_port": upstream_port},
    )
    proxy_server = http.server.ThreadingHTTPServer((host, port), handler_class)
    actual_host, actual_port = proxy_server.server_address[:2]
    display_host = "127.0.0.1" if actual_host == "0.0.0.0" else actual_host
    url = f"http://{display_host}:{actual_port}/"
    print(f"Serving Zensical live preview at {url}", flush=True)
    print("Cross-origin isolation headers are enabled for SharedArrayBuffer.", flush=True)

    if open_browser:
        webbrowser.open(url)

    try:
        proxy_server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.", flush=True)
    finally:
        if proxy_server is not None:
            proxy_server.server_close()
        terminate_upstream()


def main() -> None:
    global upstream_process

    config_file = find_config_file()
    parser = argparse.ArgumentParser(
        description="Serve Zensical through a cross-origin-isolated live preview proxy.",
    )
    parser.add_argument(
        "-a",
        "--dev-addr",
        default=configured_dev_addr(config_file),
        metavar="HOST:PORT",
        help="IP address and port to serve (default: zensical.toml dev_addr).",
    )
    parser.add_argument(
        "-f",
        "--config-file",
        default=str(config_file),
        help="Path to config file.",
    )
    parser.add_argument(
        "-o",
        "--open",
        action="store_true",
        help="Open preview in default browser.",
    )
    args = parser.parse_args()

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    config_file = Path(args.config_file).resolve()
    host, port = parse_dev_addr(args.dev_addr)
    upstream_port = unused_loopback_port()
    upstream_process = start_zensical(config_file, upstream_port)
    wait_for_upstream(upstream_port, upstream_process)
    serve_proxy(host, port, upstream_port, open_browser=args.open)


if __name__ == "__main__":
    main()
