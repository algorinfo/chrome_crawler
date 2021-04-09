import urllib.parse
import http.server
import socketserver
import time
import json


class ExampleHandler(http.server.SimpleHTTPRequestHandler):
    def _send_content(self, data, status=200, content_type="text/plain"):
        if isinstance(data, str):
            data = data.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        self.wfile.flush()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        if url.path == "/":
            return self._send_content(
                """
                <html>
                <head>
                <meta name="title" content="Test">
                </head>
                <body>
                <form method=get action=/data>
                <input type=search name=q><input type=submit></form>
                </body></html> """,
                content_type="text/html",
            )
        elif url.path == "/data":
            qs = urllib.parse.parse_qs(url.query)
            return self._send_content(json.dumps(qs), content_type="application/json")
        elif url.path == "/wait":
            time.sleep(200)
            return self._send_content(
                "<h3> Be patient ;)</h3>",
                content_type="text/html",
            )

        else:
            return self._send_content(f"404: {url}", status=400)


if __name__ == "__main__":
    PORT = 8891
    with socketserver.TCPServer(("", PORT), ExampleHandler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()
