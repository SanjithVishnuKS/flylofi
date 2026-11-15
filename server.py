"""
Sentinel + Focus Flight Local Server (Python)
Provides full local server functionality matching server/main.go:
- / -> Sentinel dashboard
- /focus-flight/ -> Flylofi Focus Flight app
- /media/ -> Streaming for video and audio
- /api/media -> Auto-discovery of all media files
- /api/health -> Healthcheck
"""

import os
import sys
import json
import mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

PORT = int(os.environ.get("LISTEN_ADDR", "8080").replace(":", ""))
APP_ROOT = os.path.abspath(os.path.dirname(__file__))
MEDIA_ROOT = os.environ.get("MEDIA_ROOT", os.path.join(APP_ROOT, "media"))

def get_media_type(path):
    lower = path.lower().replace("\\", "/")
    ext = os.path.splitext(lower)[1]
    if "/audio/" in lower or ext in [".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".opus"]:
        return "audio"
    if "/clips/" in lower or "/videos/" in lower or ext in [".mp4", ".mov", ".mkv"]:
        return "video"
    if ext == ".webm":
        return "audio" if "audio" in lower else "video"
    if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]:
        return "image"
    return "other"

def scan_media(root_dir):
    files = []
    if not os.path.exists(root_dir):
        return files
    for dirpath, _, filenames in os.walk(root_dir):
        for name in filenames:
            full = os.path.join(dirpath, name)
            mtype = get_media_type(full)
            if mtype == "other":
                continue
            rel = os.path.relpath(full, root_dir).replace("\\", "/")
            stat = os.stat(full)
            files.append({
                "name": name,
                "path": "/media/" + rel,
                "type": mtype,
                "size": stat.st_size,
                "modified": os.path.getmtime(full)
            })
    return files

class SentinelHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "mediaRoot": MEDIA_ROOT}).encode("utf-8"))
            return

        if path == "/api/media":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(scan_media(MEDIA_ROOT)).encode("utf-8"))
            return

        if path.startswith("/media/"):
            rel_media = path[len("/media/"):]
            local_target = os.path.join(MEDIA_ROOT, rel_media)
            if os.path.isfile(local_target):
                self.serve_file(local_target)
                return
            self.send_error(404, "Media file not found")
            return

        # Default static file serving from APP_ROOT
        if path == "/" or path == "":
            local_target = os.path.join(APP_ROOT, "index.html")
        elif path.startswith("/focus-flight/"):
            rel = path[len("/focus-flight/"):]
            if not rel or rel == "/":
                rel = "app.html"
            local_target = os.path.join(APP_ROOT, "focus-flight", rel)
        else:
            local_target = os.path.join(APP_ROOT, path.lstrip("/"))

        if os.path.isfile(local_target):
            self.serve_file(local_target)
        elif os.path.isdir(local_target):
            index_path = os.path.join(local_target, "app.html") if "focus-flight" in local_target else os.path.join(local_target, "index.html")
            if os.path.isfile(index_path):
                self.serve_file(index_path)
            else:
                self.send_error(404, "Directory index not found")
        else:
            self.send_error(404, "File not found")

    def serve_file(self, filepath):
        ctype, _ = mimetypes.guess_type(filepath)
        if not ctype:
            if filepath.endswith(".webm"):
                ctype = "audio/webm" if "audio" in filepath.lower() else "video/webm"
            elif filepath.endswith(".mp4"):
                ctype = "video/mp4"
            else:
                ctype = "application/octet-stream"

        try:
            size = os.path.getsize(filepath)
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            with open(filepath, "rb") as f:
                while chunk := f.read(64 * 1024):
                    self.wfile.write(chunk)
        except Exception as e:
            self.send_error(500, str(e))

def run():
    print(f"Starting Sentinel + Focus Flight Server on http://localhost:{PORT}")
    print(f"Media root: {MEDIA_ROOT}")
    print(f"Sentinel URL: http://localhost:{PORT}/")
    print(f"Focus Flight URL: http://localhost:{PORT}/focus-flight/app.html")
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), SentinelHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    run()
