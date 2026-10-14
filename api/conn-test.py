"""POST /api/conn-test — user ke URL par ASLI reachability check.

Body: {"url": "https://...", "health_path": "/health", "auth": {...}}
Auth values sirf outgoing request me use hote hain — kabhi log/echo nahi.
"""
import base64
import ipaddress
import json
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler


def _url_safe(url):
    try:
        p = urllib.parse.urlparse(url)
    except Exception:
        return False, "bad url"
    if p.scheme != "https":
        return False, "sirf https:// allowed"
    if not p.hostname:
        return False, "hostname missing"
    try:
        infos = socket.getaddrinfo(p.hostname, p.port or 443,
                                   family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)
    except Exception:
        return False, "DNS resolve fail"
    for fam, _t, _pr, _c, sockaddr in infos:
        try:
            ip = ipaddress.ip_address(sockaddr[0])
        except Exception:
            return False, "bad resolved ip"
        if (ip.is_private or ip.is_loopback or ip.is_link_local
                or ip.is_reserved or ip.is_multicast or ip.is_unspecified):
            return False, "blocked ip range"
    return True, ""


def _auth_headers(auth):
    h = {}
    if not isinstance(auth, dict):
        return h
    t = auth.get("type", "none")
    if t == "api-key" and auth.get("value"):
        h[str(auth.get("header") or "X-API-Key")] = str(auth["value"])
    elif t == "bearer" and auth.get("value"):
        h["Authorization"] = "Bearer " + str(auth["value"])
    elif t == "basic" and auth.get("value"):
        h["Authorization"] = "Basic " + base64.b64encode(
            str(auth["value"]).encode()).decode()
    return h


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _check(url, headers, timeout=8):
    opener = urllib.request.build_opener(_NoRedirect)
    req = urllib.request.Request(url, headers={"User-Agent": "mimi-hub-preview/1.0",
                                               "Accept": "application/json", **headers},
                                 method="GET")
    t0 = time.time()
    try:
        with opener.open(req, timeout=timeout) as resp:
            body = resp.read(4000).decode("utf-8", "replace")
            return {"ok": True, "status": "connected", "http_code": resp.status,
                    "ms": int((time.time() - t0) * 1000),
                    "detail": f"HTTP {resp.status} — reachable"}
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return {"ok": False, "status": "auth-required",
                    "error": f"HTTP {e.code} — auth chahiye"}
        return {"ok": False, "status": "unreachable", "error": f"HTTP {e.code}"}
    except Exception as e:
        return {"ok": False, "status": "unreachable",
                "error": f"{type(e).__name__}: {str(e)[:120]}"}


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
        if ln <= 0 or ln > 50000:
            return self._json({"ok": False, "error": "bad body"}, 400)
        try:
            p = json.loads(self.rfile.read(ln) or b"{}")
        except Exception:
            return self._json({"ok": False, "error": "bad json"}, 400)
        url = str(p.get("url", "")).strip()
        hp = str(p.get("health_path", "") or "").strip()
        full = url.rstrip("/") + (hp if hp.startswith("/") else "")
        ok, why = _url_safe(full)
        if not ok:
            return self._json({"ok": False, "error": f"URL blocked — {why}"}, 400)
        self._json(_check(full, _auth_headers(p.get("auth"))))

    def do_GET(self):
        self._json({"ok": False, "error": "POST only"}, 405)
