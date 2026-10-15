"""POST /api/oauth-check — Lovable client_id + redirect_uri validate karo
   BINA browser redirect ke. User ko pehle hi pata chal jayega ki
   login kaam karega ya nahi.

Body: {client_id}
Returns: {ok, will_work, detail}
"""
import json
import re
import urllib.request
import urllib.parse
import urllib.error
from http.server import BaseHTTPRequestHandler

AUTH_URL = "https://lovable.dev/oauth/authorize"
REDIRECT = "https://mimi-connector-hub-preview-indocial5014-1702.vercel.app/"
CID_RE = re.compile(r"^[A-Za-z0-9_-]{8,128}$")
PUBLIC_CID = "6d465f583e1e4ce5801b1616f735670c"


class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class handler(BaseHTTPRequestHandler):
    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
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
        if ln <= 0 or ln > 2000:
            return self._json({"ok": False, "error": "bad body"}, 400)
        try:
            p = json.loads(self.rfile.read(ln) or b"{}")
        except Exception:
            return self._json({"ok": False, "error": "bad json"}, 400)

        cid = str(p.get("client_id", "")).strip()[:128]
        if not CID_RE.match(cid):
            return self._json({"ok": False, "error": "Client ID galat format me hai"})

        # Public client_id web redirect par kabhi kaam nahi karega — pehle hi bata do
        if cid == PUBLIC_CID:
            return self._json({
                "ok": True, "will_work": False,
                "detail": "Ye Lovable ka PUBLIC client_id hai — ye sirf desktop apps (Cursor/Claude Desktop) ke liye hai, web redirect par kaam NAHI karega. Apna khud ka OAuth client lovable.dev dashboard me banao."})

        q = urllib.parse.urlencode({
            "response_type": "code", "client_id": cid, "redirect_uri": REDIRECT,
            "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-c",
            "code_challenge_method": "S256", "state": "probeck",
            "scope": "projects:read projects:write", "resource": "https://mcp.lovable.dev"})
        req = urllib.request.Request(AUTH_URL + "?" + q, method="GET",
                                    headers={"User-Agent": "mimi-preview/1"})
        opener = urllib.request.build_opener(NoRedir)
        try:
            with opener.open(req, timeout=20) as r:
                # 200 = error page (par body me detail hoga)
                raw = r.read(4000).decode("utf-8", "replace")
                if "invalid_client" in raw:
                    return self._json({"ok": True, "will_work": False,
                                       "detail": "Client ID Lovable ko nahi mila (invalid_client). ID dobara check karo."})
                return self._json({"ok": True, "will_work": False,
                                   "detail": "Lovable ne request reject ki (invalid_request). Redirect URI dashboard me registered URI se match nahi ho rahi."})
        except urllib.error.HTTPError as e:
            if e.code in (302, 303, 307):
                loc = e.headers.get("Location", "")
                # login page par redirect = client OK
                if "login" in loc or "oauth" in loc or e.code == 302:
                    return self._json({"ok": True, "will_work": True,
                                       "detail": "✅ Client ID sahi hai aur redirect URI approved hai! Ab 'Lovable se Login karo' dabao."})
            try:
                raw = e.read(4000).decode("utf-8", "replace")
            except Exception:
                raw = ""
            if "invalid_client" in raw:
                return self._json({"ok": True, "will_work": False,
                                   "detail": "Client ID galat hai (invalid_client). Lovable dashboard se sahi ID copy karo."})
            return self._json({"ok": True, "will_work": False,
                               "detail": "Redirect URI approved nahi hai (invalid_request). Dashboard me ye EXACT URI dalo: " + REDIRECT})
        except Exception as e:
            return self._json({"ok": False, "error": "check fail: " + str(e)[:120]})

    def do_GET(self):
        self._json({"ok": False, "error": "POST only"}, 405)
