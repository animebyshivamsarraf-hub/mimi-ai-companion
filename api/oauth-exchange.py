"""POST /api/oauth-exchange — Lovable OAuth code -> token (PKCE, public client).

Body: {code, code_verifier, redirect_uri}
Server lovable.dev/oauth/token ko call karta hai. Token kabhi log nahi hota.
"""
import json
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler

TOKEN_URL = "https://lovable.dev/oauth/token"
CLIENT_ID = "https://mimi-connector-hub-preview-indocial5014-1702.vercel.app/.well-known/mimi-mcp-client.json"
ALLOWED_REDIRECT = "https://mimi-connector-hub-preview-indocial5014-1702.vercel.app/"


class handler(BaseHTTPRequestHandler):
    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            ln = int(self.headers.get("Content-Length", 0))
        except Exception:
            ln = 0
        if ln <= 0 or ln > 4000:
            return self._json({"ok": False, "error": "bad body"}, 400)
        try:
            p = json.loads(self.rfile.read(ln) or b"{}")
        except Exception:
            return self._json({"ok": False, "error": "bad json"}, 400)

        code = str(p.get("code", ""))[:500]
        verifier = str(p.get("code_verifier", ""))[:200]
        redirect_uri = str(p.get("redirect_uri", ""))[:300]
        if not code or not verifier:
            return self._json({"ok": False, "error": "code/verifier missing"}, 400)
        if redirect_uri != ALLOWED_REDIRECT:
            return self._json({"ok": False, "error": "redirect_uri mismatch"}, 400)

        data = urllib.parse.urlencode({
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": CLIENT_ID,
            "code_verifier": verifier,
        }).encode()
        req = urllib.request.Request(TOKEN_URL, data=data, method="POST",
                                    headers={"Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                tok = json.loads(r.read().decode("utf-8", "replace"))
        except Exception as e:
            return self._json({"ok": False, "error": "token exchange fail: " + str(e)[:160]})

        if tok.get("error"):
            return self._json({"ok": False,
                               "error": str(tok.get("error_description") or tok.get("error"))[:200]})
        if not tok.get("access_token"):
            return self._json({"ok": False, "error": "no access_token returned"})
        self._json({"ok": True,
                    "access_token": tok["access_token"],
                    "refresh_token": tok.get("refresh_token", ""),
                    "expires_in": tok.get("expires_in", 0),
                    "token_type": tok.get("token_type", "Bearer")})

    def do_GET(self):
        self._json({"ok": False, "error": "POST only"}, 405)
