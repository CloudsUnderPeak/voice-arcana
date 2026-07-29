from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class VoiceArcanaRequestHandler(SimpleHTTPRequestHandler):
    """Serve source files and expose public assets at the site root."""

    def __init__(self, *args, root: Path, **kwargs):
        self.root = root
        super().__init__(*args, directory=str(root), **kwargs)

    def translate_path(self, path: str) -> str:
        request_path = unquote(urlsplit(path).path).lstrip("/")
        candidate = (self.root / request_path).resolve()

        try:
            candidate.relative_to(self.root)
        except ValueError:
            return str(self.root / "__forbidden__")

        if request_path and not candidate.exists():
            public_candidate = (self.root / "public" / request_path).resolve()
            try:
                public_candidate.relative_to(self.root / "public")
            except ValueError:
                return str(candidate)
            if public_candidate.exists():
                return str(public_candidate)

        return str(candidate)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Voice Arcana local static server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--root", type=Path, default=PROJECT_ROOT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = args.root.resolve()

    def handler(*handler_args, **handler_kwargs):
        return VoiceArcanaRequestHandler(
            *handler_args,
            root=root,
            **handler_kwargs,
        )

    server = ThreadingHTTPServer((args.host, args.port), handler)
    server.daemon_threads = True
    print(f"Voice Arcana dev server: http://{args.host}:{args.port}/")
    print(f"Serving: {root}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
