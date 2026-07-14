from playwright.sync_api import sync_playwright
import json

def get_presyo_api():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        def handle_response(response):
            if "json" in response.headers.get("content-type", ""):
                try:
                    data = response.json()
                    print(f"API URL: {response.url}")
                    # print(json.dumps(data, indent=2)[:500])  # Just print the start
                except Exception as e:
                    pass
                    
        page.on("response", handle_response)
        page.goto("https://presyo.icsc.ngo/national", wait_until="networkidle", timeout=60000)
        browser.close()

if __name__ == "__main__":
    get_presyo_api()
