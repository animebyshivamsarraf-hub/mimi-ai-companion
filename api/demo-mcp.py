"""POST /api/demo-mcp — public demo MCP server (Streamable HTTP, no auth).

MCP JSON-RPC handle karta hai: initialize, notifications/initialized, tools/list.
Isliye banaya taaki user pura plug-in flow REAL me experience kar sake:
Connect -> asli test -> asli tool discovery -> approve -> save -> connected.
"""
import json
from http.server import BaseHTTPRequestHandler

TOOLS = [
    {"name": "mimi_greet",
     "description": "Mimi ki taraf se greeting bhejta hai",
     "inputSchema": {"type": "object",
                     "properties": {"name": {"type": "string", "description": "kiska naam"}},
                     "required": []}},
    {"name": "mimi_joke",
     "description": "Ek chhota joke sunata hai",
     "inputSchema": {"type": "object", "properties": {}, "required": []}},
    {"name": "mimi_time",
     "description": "Abhi ka samay batata hai (IST)",
     "inputSchema": {"type": "object", "properties": {}, "required": []}},
]


class handler(BaseHTTPRequestHandler):
    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _rpc(self, rid, result=None, error=None):
        msg = {"jsonrpc": "2.0", "id": rid}
        if error is not None:
            msg["error"] = error
        else:
            msg["result"] = result
        return msg

    def do_POST(self):
        try:
            ln = int(self.headers.get("Content-Length", 0))
        except Exception:
            ln = 0
        if ln <= 0 or ln > 20000:
            return self._json(self._rpc(None, error={"code": -32700, "message": "bad body"}))
        try:
            p = json.loads(self.rfile.read(ln) or b"{}")
        except Exception:
            return self._json(self._rpc(None, error={"code": -32700, "message": "parse error"}))

        method = p.get("method", "")
        rid = p.get("id")
        params = p.get("params", {}) or {}

        if method == "initialize":
            return self._json(self._rpc(rid, {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "mimi-demo-mcp", "version": "1.0.0"},
            }))
        if method == "notifications/initialized":
            self.send_response(202)
            self.end_headers()
            return
        if method == "tools/list":
            return self._json(self._rpc(rid, {"tools": TOOLS}))
        if method == "tools/call":
            name = (params.get("name") or "")
            args = params.get("arguments", {}) or {}
            if name == "mimi_greet":
                who = args.get("name") or "dost"
                text = "Namaste %s! Main Mimi hun — demo MCP se bol rahi hun." % who
            elif name == "mimi_joke":
                text = "Computer ne job kyun chhodi? Uske paas bahut saare 'tabs' khule the!"
            elif name == "mimi_time":
                from datetime import datetime, timezone, timedelta
                ist = datetime.now(timezone(timedelta(hours=5, minutes=30)))
                text = "Abhi IST me " + ist.strftime("%I:%M %p") + " baje hain."
            else:
                return self._json(self._rpc(rid, error={"code": -32602, "message": "unknown tool"}))
            return self._json(self._rpc(rid, {"content": [{"type": "text", "text": text}]}))
        return self._json(self._rpc(rid, error={"code": -32601, "message": "method not found"}))

    def do_GET(self):
        self._json({"ok": True, "server": "mimi-demo-mcp",
                    "usage": "POST MCP JSON-RPC here (initialize, tools/list). No auth."})
