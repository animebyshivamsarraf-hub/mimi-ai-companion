"""POST /api/mcp-discover — MCP URL par ASLI handshake + tools/list.

Body: {"mcp_url": "https://...", "auth": {...}}
Auth values sirf outgoing request me — kabhi log/echo nahi.
"""
import base64
import ipaddress
import json
import socket
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


def _parse_body(body):
    body = body.strip()
    if not body:
        return None
    if body[0] in "{[":
        return json.loads(body)
    for line in body.splitlines():
        line = line.strip()
        if line.startswith("data:"):
            dl = line[5:].strip()
            if dl and dl != "[DONE]":
                try:
                    return json.loads(dl)
                except Exception:
                    continue
    return None


def _discover(mcp_url, headers, timeout=12):
    opener = urllib.request.build_opener(_NoRedirect)

    def rpc(method, params=None, notif=False, session=None):
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        if not notif:
            payload["id"] = 1
        h = {"Content-Type": "application/json",
             "Accept": "application/json, text/event-stream",
             "User-Agent": "mimi-hub-preview/1.0", **headers}
        if session:
            h["Mcp-Session-Id"] = session
        req = urllib.request.Request(mcp_url, data=json.dumps(payload).encode(),
                                     headers=h, method="POST")
        with opener.open(req, timeout=timeout) as resp:
            sess = resp.headers.get("Mcp-Session-Id")
            body = resp.read(200000).decode("utf-8", "replace")
            return sess, body

    try:
        sess, body = rpc("initialize", {
            "protocolVersion": "2024-11-05", "capabilities": {},
            "clientInfo": {"name": "mimi-hub-preview", "version": "1.0"}})
        parsed = _parse_body(body)
        if not isinstance(parsed, dict) or "result" not in parsed:
            return {"ok": False, "error": "MCP handshake fail — ye MCP server nahi lagta"}
        try:
            rpc("notifications/initialized", {}, notif=True, session=sess)
        except Exception:
            pass
        _, body2 = rpc("tools/list", session=sess)
        parsed2 = _parse_body(body2)
        tools = (parsed2.get("result", {}) or {}).get("tools", []) \
            if isinstance(parsed2, dict) else []
        if not isinstance(tools, list):
            return {"ok": False, "error": "tools/list samajh nahi aaya"}
        return {"ok": True, "status": "connected",
                "detail": f"MCP handshake OK — {len(tools)} tools mile",
                "tools": [{"name": str(t.get("name", "")),
                           "description": str(t.get("description", ""))[:200],
                           "annotations": t.get("annotations") if isinstance(t.get("annotations"), dict) else {}}
                          for t in tools if t.get("name")]}
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return {"ok": False, "error": f"HTTP {e.code} — MCP auth chahiye"}
        return {"ok": False, "error": f"HTTP {e.code}"}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {str(e)[:140]}"}


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
        mcp_url = str(p.get("mcp_url", "")).strip()
        ok, why = _url_safe(mcp_url)
        if not ok:
            return self._json({"ok": False, "error": f"URL blocked — {why}"}, 400)
        self._json(_discover(mcp_url, _auth_headers(p.get("auth"))))

    def do_GET(self):
        self._json({"ok": False, "error": "POST only"}, 405)
