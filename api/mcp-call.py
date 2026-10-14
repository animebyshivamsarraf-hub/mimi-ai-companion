"""POST /api/mcp-call — MCP server par REAL tools/call (read-only demo ke liye).

Body: {mcp_url, tool_name, arguments?, auth?}
SSRF protection mcp-discover jaisi: https-only, DNS resolve, private/loopback/
link-local/metadata ranges blocked, redirects off, timeouts.

Sensitive/destructive tools yahan se nahi chalte — UI sirf connected
demo connectors par 'Try' dikhata hai. Auth values kabhi echo nahi hote.
"""
import json
import socket
import ipaddress
import urllib.request
import urllib.parse
import urllib.error
from http.server import BaseHTTPRequestHandler

BLOCKED_NETS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def _safe_url(u):
    try:
        p = urllib.parse.urlparse(u)
    except Exception:
        return None, "bad url"
    if p.scheme != "https":
        return None, "sirf https:// allowed"
    host = (p.hostname or "").lower()
    if not host or host in ("localhost",):
        return None, "blocked host"
    try:
        infos = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    except Exception:
        return None, "DNS resolve fail"
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except Exception:
            continue
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast \
                or ip.is_reserved or ip.is_unspecified:
            return None, "blocked ip range"
        for net in BLOCKED_NETS:
            try:
                if ip in net:
                    return None, "blocked ip range"
            except Exception:
                pass
    return p.geturl(), ""


def _post(url, payload, auth, timeout=25):
    body = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json",
               "Accept": "application/json, text/event-stream",
               "MCP-Protocol-Version": "2024-11-05"}
    atype = (auth or {}).get("type", "")
    aval = (auth or {}).get("value", "")
    if atype == "bearer" and aval:
        headers["Authorization"] = "Bearer " + aval
    elif atype == "api-key" and aval:
        headers[(auth or {}).get("header") or "X-API-Key"] = aval
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler)
    # redirects off: use non-following handler
    class NoRedir(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None
    opener = urllib.request.build_opener(NoRedir)
    try:
        with opener.open(req, timeout=timeout) as r:
            raw = r.read(200000).decode("utf-8", "replace")
            return r.status, raw, ""
    except urllib.error.HTTPError as e:
        try:
            raw = e.read(20000).decode("utf-8", "replace")
        except Exception:
            raw = ""
        return e.code, raw, ""
    except Exception as e:
        return 0, "", str(e)[:160]


def _extract_json(raw):
    raw = raw.strip()
    if raw.startswith("{"):
        try:
            return json.loads(raw), ""
        except Exception:
            pass
    for line in raw.splitlines():
        line = line.strip()
        if line.startswith("data:"):
            line = line[5:].strip()
        if line.startswith("{"):
            try:
                return json.loads(line), ""
            except Exception:
                continue
    return None, "MCP response samajh nahi aaya"


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
        if ln <= 0 or ln > 8000:
            return self._json({"ok": False, "error": "bad body"}, 400)
        try:
            p = json.loads(self.rfile.read(ln) or b"{}")
        except Exception:
            return self._json({"ok": False, "error": "bad json"}, 400)

        mcp_url = str(p.get("mcp_url", ""))[:500]
        tool = str(p.get("tool_name", ""))[:120]
        args = p.get("arguments") or {}
        auth = p.get("auth") or {}
        if not mcp_url or not tool:
            return self._json({"ok": False, "error": "mcp_url/tool_name chahiye"}, 400)
        if not isinstance(args, dict):
            return self._json({"ok": False, "error": "arguments object hona chahiye"}, 400)
        if not isinstance(tool, str) or not tool.replace("_", "").replace("-", "").isalnum():
            return self._json({"ok": False, "error": "galat tool name"}, 400)

        url, err = _safe_url(mcp_url)
        if not url:
            return self._json({"ok": False, "error": "URL blocked — " + err})

        # 1) initialize
        st, raw, e = _post(url, {"jsonrpc": "2.0", "id": 1, "method": "initialize",
                                "params": {"protocolVersion": "2024-11-05", "capabilities": {},
                                           "clientInfo": {"name": "mimi-preview", "version": "1"}}},
                          auth)
        if st == 401:
            return self._json({"ok": False, "error": "HTTP 401 — MCP auth chahiye"})
        if st != 200:
            return self._json({"ok": False, "error": "HTTP " + str(st) if st else "connect fail: " + e})
        # 2) initialized notification (best-effort)
        _post(url, {"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}}, auth, timeout=8)
        # 3) tools/call
        st, raw, e = _post(url, {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
                                "params": {"name": tool, "arguments": args}}, auth)
        if st == 401:
            return self._json({"ok": False, "error": "HTTP 401 — MCP auth chahiye"})
        if st != 200:
            return self._json({"ok": False, "error": "HTTP " + str(st) if st else "call fail: " + e})
        data, derr = _extract_json(raw)
        if not data:
            return self._json({"ok": False, "error": derr})
        if data.get("error"):
            er = data["error"]
            msg = er.get("message") if isinstance(er, dict) else str(er)
            return self._json({"ok": False, "error": "tool error: " + str(msg)[:200]})
        res = data.get("result") or {}
        return self._json({"ok": True, "result": res})

    def do_GET(self):
        self._json({"ok": False, "error": "POST only"}, 405)
