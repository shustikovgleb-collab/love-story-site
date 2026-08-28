import http.server
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))

port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        http.server.SimpleHTTPRequestHandler.end_headers(self)


httpd = http.server.ThreadingHTTPServer(("", port), NoCacheHandler)
print("Serving (no-cache) on port", port)
httpd.serve_forever()
