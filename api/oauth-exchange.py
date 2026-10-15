"""POST /api/oauth-exchange — Lovable OAuth code -> token (PKCE public client).

Body: {code, code_verifier, redirect_uri, client_id}
- client_id: Lovable dashboard me user ka registered OAuth client
- redirect_uri: sirf allowlisted preview URL allowed
- PKCE-only: koi client_secret browser se accept nahi hota (security)

Server lovable.dev/oauth/token ko call karta hai. Secrets kabhi log nahi hote.
"""
import json
import re
import urllib.request
import urllib.parse
import urllib.error
from http.server import BaseHTTPRequestHandler

TOKEN_URL = "https://lovable.dev/oauth/token"
ALLOWED_REDIRECT = "https://mimi-connector-hub-preview-indocial5014-1702.vercel.app/"
CID_RE = re.compile(r"^[A-Za-z0-9_-]{8,128}$")


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

        code = str(p.get("code", ""))[:800]
        verifier = str(p.get("code_verifier", ""))[:200]
        redirect_uri = str(p.get("redirect_uri", ""))[:300]
        client_id = str(p.get("client_id", ""))[:128]
        # SECURITY: browser se client_secret accept nahi karte — PKCE-only public client flow
        if not code or not verifier:
            return self._json({"ok": False, "error": "code/verifier missing"}, 400)
        if redirect_uri != ALLOWED_REDIRECT:
            return self._json({"ok": False, "error": "redirect_uri mismatch"}, 400)
        if not CID_RE.match(client_id):
            return self._json({"ok": False, "error": "client_id galat format"}, 400)

        fields = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "code_verifier": verifier,
        }
        data = urllib.parse.urlencode(fields).encode()
        req = urllib.request.Request(TOKEN_URL, data=data, method="POST",
                                    headers={"Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                tok = json.loads(r.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read(2000).decode("utf-8", "replace")
            except Exception:
                err_body = ""
            return self._json({"ok": False,
                               "error": "token exchange HTTP %d: %s" % (e.code, err_body[:160])})
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
