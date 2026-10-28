"""同じ Wi-Fi の iPhone からアプリを開くための簡易サーバー。

使い方:  python serve.py   （このフォルダで実行）
"""
import http.server, socket, os

PORT = 8000
here = os.path.dirname(os.path.abspath(__file__))

def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".webmanifest": "application/manifest+json", ".js": "text/javascript"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=here, **kwargs)

print(f"iPhone の Safari で開いてください →  http://{lan_ip()}:{PORT}/")
print("止めるときは Ctrl+C")
http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
