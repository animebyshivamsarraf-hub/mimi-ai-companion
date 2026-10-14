"""POST /api/chat — chhota rule-based demo brain (jawab me demo label)."""
import json
from http.server import BaseHTTPRequestHandler


def _brain(msg: str) -> str:
    m = msg.lower()
    if any(w in m for w in ["namaste", "hello", "hey", "salaam"]) and len(m) < 20:
        return "Namaste! 🙏 Main Mimi hun (demo brain). 🔌 Hub me jakar apna pehla connector jodkar dekho — Test dabane par asli connection check hoga."
    if "mcp" in m:
        return "MCP = Model Context Protocol. 🔌 Hub → Add Connector → MCP Server chuno, apne MCP ka URL dalo, Test dabao — main tools/list se asli tools discover karungi. (demo brain)"
    if "connector" in m or "jod" in m:
        return "Connector jodne ke liye: 🔌 Hub kholo → ＋ Add Connector → type chuno (REST/MCP/AI) → URL + auth bharo → Test Connection dabao. Test bilkul asli hai. (demo brain)"
    if "lovable" in m:
        return "Lovable ke liye abhi Business plan + API key chahiye jo hamare paas nahi hai, isliye status Unavailable hai — ye honest hai. (demo brain)"
    if any(w in m for w in ["tum kaun", "who are you", "naam", "aap kaun"]):
        return "Main Mimi hun — tumhari AI companion! Is preview me mera brain demo hai, lekin Hub ke connection tests bilkul asli hain. 💜"
    if "madad" in m or "help" in m or "kya kar" in m:
        return "Preview me: 🔌 Hub me connectors ka asli connection test, MCP tools discover, aur sawalon ke jawab (demo brain). Batao kya try karna hai?"
    return "Samajh gaya! (demo brain) — 🔌 Hub me ek connector ka Test dabakar dekho, wo bilkul asli check hai."


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
        if ln <= 0 or ln > 5000:
            return self._json({"ok": False, "error": "bad body"}, 400)
        try:
            p = json.loads(self.rfile.read(ln) or b"{}")
        except Exception:
            return self._json({"ok": False, "error": "bad json"}, 400)
        msg = str(p.get("message", ""))[:500]
        if not msg.strip():
            return self._json({"ok": False, "error": "message khaali hai"}, 400)
        self._json({"ok": True, "reply": _brain(msg), "demo": True})

    def do_GET(self):
        self._json({"ok": False, "error": "POST only"}, 405)
