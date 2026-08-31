"""Serve a built Sanity Studio locally, including direct document URLs."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


class StudioHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        route = urlsplit(self.path).path
        requested = Path(self.translate_path(route))
        if not requested.exists() and not Path(route).suffix and not route.startswith('/static/'):
            self.path = '/index.html'
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', default=str(Path(__file__).parent / 'dist'))
    parser.add_argument('--port', type=int, default=3334)
    args = parser.parse_args()
    directory = Path(args.directory).resolve()
    if not (directory / 'index.html').is_file():
        parser.error('Build Sanity Studio before starting this server.')
    handler = partial(StudioHandler, directory=str(directory))
    print(f'Sanity Studio: http://127.0.0.1:{args.port}/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), handler).serve_forever()
