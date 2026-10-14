"""POST /api/demo-mcp — public demo MCP server (Streamable HTTP, no auth).

MCP JSON-RPC handle karta hai: initialize, notifications/initialized, tools/list.
Isliye banaya taaki user pura plug-in flow REAL me experience kar sake:
Connect -> asli test -> asli tool discovery -> approve -> save -> connected.
"""
import json
import random
from http.server import BaseHTTPRequestHandler

# Demo records (search/fetch ke liye)
RECORDS = {
    "id1": {"id": "id1", "title": "Mimi Project Notes",
            "content": "Mimi ek cute 3D AI companion hai — voice + chat + MCP tools.",
            "metadata": {"author": "Rishi", "date": "2026-10-14"}},
    "id2": {"id": "id2", "title": "Connector Hub Guide",
            "content": "Hub me MCP server jodo: naam + URL → Connect → tools discover → approve → save.",
            "metadata": {"author": "Rishi", "date": "2026-10-14"}},
    "id3": {"id": "id3", "title": "FastMCP Pattern",
            "content": "@mcp.tool() decorator se Python functions MCP tools ban jaate hain.",
            "metadata": {"author": "Rishi", "date": "2026-10-14"}},
}

TOOLS = [
    {"name": "mimi_greet",
     "description": "Mimi ki taraf se greeting bhejta hai",
     "inputSchema": {"type": "object",
                     "properties": {"name": {"type": "string", "description": "kiska naam"}},
                     "required": []},
     "annotations": {"readOnlyHint": True}},
    {"name": "mimi_joke",
     "description": "Ek chhota joke sunata hai",
     "inputSchema": {"type": "object", "properties": {}, "required": []},
     "annotations": {"readOnlyHint": True}},
    {"name": "mimi_time",
     "description": "Abhi ka samay batata hai (IST)",
     "inputSchema": {"type": "object", "properties": {}, "required": []},
     "annotations": {"readOnlyHint": True}},
    {"name": "roll_dice",
     "description": "Dice roll karta hai (FastMCP example)",
     "inputSchema": {"type": "object",
                     "properties": {"sides": {"type": "integer", "description": "kitne sides", "default": 6}},
                     "required": []},
     "annotations": {"readOnlyHint": True}},
    {"name": "get_status",
     "description": "System status check karta hai",
     "inputSchema": {"type": "object", "properties": {}, "required": []},
     "annotations": {"readOnlyHint": True}},
    {"name": "search",
     "description": "Records me query search karta hai — {ids: [...]} deta hai",
     "inputSchema": {"type": "object",
                     "properties": {"query": {"type": "string", "description": "search text"}},
                     "required": ["query"]},
     "annotations": {"readOnlyHint": True}},
    {"name": "fetch",
     "description": "ID se pura record nikalta hai",
     "inputSchema": {"type": "object",
                     "properties": {"id": {"type": "string", "description": "record ID"}},
                     "required": ["id"]},
     "annotations": {"readOnlyHint": True}},
    {"name": "delete_item",
     "description": "Ek item delete karta hai (DEMO me sirf nakli delete)",
     "inputSchema": {"type": "object",
                     "properties": {"id": {"type": "string", "description": "item ID"}},
                     "required": ["id"]},
     "annotations": {"readOnlyHint": False, "destructiveHint": True}},
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
            elif name == "roll_dice":
                try:
                    sides = int(args.get("sides", 6))
                except Exception:
                    sides = 6
                sides = max(2, min(sides, 100))
                text = "🎲 %d-sided dice: %d aaya!" % (sides, random.randint(1, sides))
            elif name == "get_status":
                text = "All systems operational ✅ (demo MCP, %d tools live)" % len(TOOLS)
            elif name == "search":
                q = str(args.get("query", "")).lower()
                ids = [rid for rid, r in RECORDS.items()
                       if q in (r["title"] + " " + r["content"]).lower()] if q else []
                return self._json(self._rpc(rid, {"content": [{"type": "text",
                    "text": json.dumps({"ids": ids}, ensure_ascii=False)}]}))
            elif name == "fetch":
                rid2 = str(args.get("id", ""))
                rec = RECORDS.get(rid2)
                if not rec:
                    return self._json(self._rpc(rid, error={"code": -32602, "message": "record nahi mila"}))
                return self._json(self._rpc(rid, {"content": [{"type": "text",
                    "text": json.dumps(rec, ensure_ascii=False)}]}))
            elif name == "delete_item":
                did = str(args.get("id", ""))
                text = "DEMO: '%s' delete nahi hua — asli me ye approval mangta!" % did
            else:
                return self._json(self._rpc(rid, error={"code": -32602, "message": "unknown tool"}))
            return self._json(self._rpc(rid, {"content": [{"type": "text", "text": text}]}))
        return self._json(self._rpc(rid, error={"code": -32601, "message": "method not found"}))

    def do_GET(self):
        self._json({"ok": True, "server": "mimi-demo-mcp",
                    "usage": "POST MCP JSON-RPC here (initialize, tools/list). No auth."})
