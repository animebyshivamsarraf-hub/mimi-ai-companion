"""GET /api/tool-status — honest static catalog (preview: sab unavailable)."""
import json
from http.server import BaseHTTPRequestHandler

STATUS = {"ok": True, "providers": [
    {"provider_id": "lovable", "display_name": "Lovable",
     "description": "AI app builder — preview me live nahi",
     "connection": "preview (no backend connection)", "enabled": True,
     "status": "unavailable",
     "detail": "Is preview me Lovable se koi live connection nahi hai.",
     "last_check": "static snapshot", "actions": []},
]}


class handler(BaseHTTPRequestHandler):
    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._json(json.loads(json.dumps(STATUS)))

    def do_POST(self):
        self._json({"ok": False, "error": "GET only"}, 405)
