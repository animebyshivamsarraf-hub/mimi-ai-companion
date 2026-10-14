"""POST /api/tool-run — preview me execution DISABLED (honest 409)."""
import json
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        self._json({"ok": False,
                    "error": "Preview me tool execution disabled hai — ye honest hai, fake result nahi."},
                   409)

    def do_GET(self):
        self._json({"ok": False, "error": "POST only"}, 405)
