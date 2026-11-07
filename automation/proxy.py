"""Fixed-upstream model gateway. No repository credentials and no arbitrary URL forwarding."""
import http.server, json, os, threading, urllib.request, urllib.error
HOST = 'https://api.openai.com/v1/responses'
LOCK = threading.Lock()
COUNT = TOTAL = 0
class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def do_POST(self):
        global COUNT, TOTAL
        try:
            if self.path != '/v1/responses': raise ValueError()
            size = int(self.headers.get('Content-Length', 0))
            if not 0 < size <= 2000000: raise ValueError()
            raw = self.rfile.read(size)
            data = json.loads(raw)
            if data.get('model') != os.environ['CODEX_MODEL']: raise ValueError()
            # External URL fetch / server-side tools are not part of this worker's permissions.
            if any(t.get('type') not in ('function','custom') for t in data.get('tools', [])): raise ValueError()
            data['max_output_tokens'] = min(int(data.get('max_output_tokens', 12000)), 12000)
            with LOCK:
                if COUNT >= int(os.environ['MAX_REQUESTS']) or TOTAL + size > int(os.environ['MAX_BYTES']):
                    self.send_error(429, 'Task model quota reached'); return
                COUNT += 1; TOTAL += size
            request = urllib.request.Request(HOST, data=json.dumps(data).encode(), headers={'Authorization':'Bearer '+os.environ['OPENAI_API_KEY'],'Content-Type':'application/json'})
            with urllib.request.urlopen(request, timeout=120) as upstream:
                self.send_response(200)
                self.send_header('Content-Type', upstream.headers.get('Content-Type','application/json'))
                self.send_header('Connection','close'); self.end_headers()
                sent=0
                while True:
                    chunk=upstream.read1(8192)
                    if not chunk: break
                    sent+=len(chunk)
                    if sent>16000000: break
                    self.wfile.write(chunk);self.wfile.flush()
                self.close_connection=True
        except urllib.error.HTTPError as exc:
            self.send_error(exc.code, 'Model upstream error')
        except Exception:
            try:self.send_error(502, 'Model gateway rejected request')
            except Exception:pass
http.server.HTTPServer(('0.0.0.0',8080),Handler).serve_forever()
