from http.server import HTTPServer, SimpleHTTPRequestHandler

APP_URL = "https://vga-team.github.io/app"
CONFIG_URL = "http://localhost:8000/app.vgaconf.json"


class CORSRequestHandler(SimpleHTTPRequestHandler): 
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()


if __name__ == "__main__":
    print("Open this link in your browser: " + f"{APP_URL}?configUrl={CONFIG_URL}")
    httpd = HTTPServer(("0.0.0.0", 8000), CORSRequestHandler)
    httpd.serve_forever()
