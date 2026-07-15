"""
Fix 2: Security Headers Middleware
Adds Content-Security-Policy, X-Content-Type-Options, Referrer-Policy,
and X-XSS-Protection to every HTTP response for defence-in-depth.
"""


class SecurityHeadersMiddleware:
    """
    Injects security response headers on every response.
    Allows CDN sources (Three.js, Chart.js, Tailwind, Google Fonts)
    while blocking all others not explicitly whitelisted.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return self.add_headers(response)

    def add_headers(self, response):
        # Content Security Policy — whitelist only trusted CDNs
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' "
            "cdn.jsdelivr.net cdnjs.cloudflare.com cdn.tailwindcss.com; "
            "style-src 'self' 'unsafe-inline' "
            "fonts.googleapis.com cdn.tailwindcss.com; "
            "font-src 'self' fonts.gstatic.com; "
            "img-src 'self' data: images.unsplash.com; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        response["Content-Security-Policy"] = csp

        # Additional security headers
        response["X-Content-Type-Options"] = "nosniff"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        return response
