#!/usr/bin/env python3
"""
Max-AI OS (2080 Edition) - Local Desktop Control Bridge
-----------------------------------------------------------
This Python script runs locally on your computer to grant Max-AI OS 
secure control over your local desktop environment (keyboard, mouse, launching apps, etc.).

Security Disclaimer:
- This script is configured to ONLY listen on localhost (127.0.0.1).
- It cannot be accessed by external machines or from the public internet.
- It is a benign, transparent routine automation tool intended for virtual assistant companion integration.

Dependencies (Install on your local machine):
    pip install pyautogui pillow

Run the server:
    python local-desktop-bridge.py
"""

import os
import sys
import json
import time
import socket
import platform
import subprocess
import webbrowser
import base64
import shutil
import glob
import urllib.parse
from io import BytesIO
from http.server import HTTPServer, BaseHTTPRequestHandler

# Port to bind the Local Desktop Bridge
PORT = 3002

# Standard PyAutoGUI import with graceful fallback warning
try:
    import pyautogui
    # Disable PyAutoGUI pause delay for faster responses
    pyautogui.PAUSE = 0.05
    # Move mouse to any corner to trigger fail-safe and abort script execution in emergency
    pyautogui.FAILSAFE = True
    HAS_PYAUTOGUI = True
except ImportError:
    HAS_PYAUTOGUI = False

# Standard Pillow import with graceful fallback for screenshots
try:
    from PIL import Image, ImageGrab
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

logs_list = []

def log_message(text, log_type="INFO"):
    timestamp = time.strftime("%H:%M:%S")
    formatted = f"[{timestamp}] [{log_type}] {text}"
    print(formatted)
    logs_list.append({
        "id": str(time.time()) + str(hash(text))[-4:],
        "text": formatted,
        "type": log_type.lower()
    })
    # Truncate logs list to keep memory usage small
    if len(logs_list) > 100:
        logs_list.pop(0)

# Register starting message
log_message("Max-AI OS Desktop Controller Bridge initializing...", "INFO")
if HAS_PYAUTOGUI:
    log_message("PyAutoGUI automation engine loaded successfully.", "SUCCESS")
else:
    log_message("PyAutoGUI package is missing. Please run: pip install pyautogui", "WARNING")

if HAS_PILLOW:
    log_message("Pillow imaging package loaded successfully (Screenshot enabled).", "SUCCESS")
else:
    log_message("Pillow package is missing. Please run: pip install pillow", "WARNING")


# Manage persistent local security token
token_file = "max-token.txt"
old_token_file = "marya-token.txt"
old_old_token_file = "tehzeeb-token.txt"
authToken = ""
try:
    if os.path.exists(token_file):
        with open(token_file, "r") as f:
            authToken = f.read().strip()
    elif os.path.exists(old_token_file):
        with open(old_token_file, "r") as f:
            authToken = f.read().strip()
        # Copy to rebranded file
        with open(token_file, "w") as f:
            f.write(authToken)
    elif os.path.exists(old_old_token_file):
        with open(old_old_token_file, "r") as f:
            authToken = f.read().strip()
        # Copy to rebranded file
        with open(token_file, "w") as f:
            f.write(authToken)

    if len(authToken) < 32:
        import secrets
        authToken = secrets.token_hex(32)
        with open(token_file, "w") as f:
            f.write(authToken)
except Exception as e:
    import uuid
    authToken = uuid.uuid4().hex + uuid.uuid4().hex
    try:
        with open(token_file, "w") as f:
            f.write(authToken)
    except Exception:
        pass


class DesktopBridgeRequestHandler(BaseHTTPRequestHandler):
    """
    A lightweight, zero-dependency HTTP server utilizing Python's built-in 
    http.server module, secured specifically to 127.0.0.1 local binding.
    """
    
    def log_message(self, format, *args):
        # Override to prevent pollution of terminal stderr with request logs
        pass

    def _authenticate(self):
        if self.command == "OPTIONS":
            return True
            
        auth_header = self.headers.get("Authorization") or self.headers.get("X-Bridge-Token") or self.headers.get("X-Myraa-Token")
        token = ""
        if auth_header:
            if auth_header.startswith("Bearer "):
                token = auth_header[7:].strip()
            else:
                token = auth_header.strip()
        else:
            # Parse query params
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            if "token" in query_params:
                token = query_params["token"][0]
                
        if token == authToken:
            return True
            
        # Logging alert
        origin = self.headers.get("Origin", "Unknown")
        log_message(f"[SECURITY ALERT] Blocked unauthorized request from origin: {origin}", "WARNING")
        
        self.send_response(401)
        self.send_header("Content-Type", "application/json")
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Unauthorized: Invalid or missing Max-AI local security token."}).encode("utf-8"))
        return False

    def _set_cors_headers(self):
        origin = self.headers.get("Origin", "")
        import re
        is_allowed = False
        if not origin:
            is_allowed = True
        else:
            pattern = r"^(https://ais-(dev|pre)-.*\.run\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+)$"
            if re.match(pattern, origin) or "google.com" in origin or "aistudio" in origin:
                is_allowed = True
                
        if is_allowed and origin:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "http://localhost:3000")
            
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bridge-Token, X-Myraa-Token")
        self.send_header("Access-Control-Allow-Credentials", "true")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        if not self._authenticate():
            return
        self._set_cors_headers()
        if self.path == "/api/status" or self.path == "/api/status/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            # Retrieve basic system telemetry metrics
            status_payload = {
                "connected": True,
                "pyautogui": HAS_PYAUTOGUI,
                "pillow": HAS_PILLOW,
                "os": platform.system(),
                "os_release": platform.release(),
                "architecture": platform.machine(),
                "hostname": socket.gethostname(),
                "logs": logs_list[-40:],
                "timestamp": time.time()
            }
            if HAS_PYAUTOGUI:
                try:
                    w, h = pyautogui.size()
                    status_payload["screen_resolution"] = f"{w}x{h}"
                    status_payload["mouse_position"] = list(pyautogui.position())
                except Exception:
                    pass
            
            self.wfile.write(json.dumps(status_payload).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Endpoint not found.")

    def do_POST(self):
        if not self._authenticate():
            return
        self._set_cors_headers()
        if self.path == "/api/action" or self.path == "/api/action/":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Invalid JSON body: {str(e)}"}).encode("utf-8"))
                return

            action_type = payload.get("type")
            args = payload.get("args", {})
            
            if not action_type:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing 'type' parameter in command envelope."}).encode("utf-8"))
                return

            log_message(f"Received instruction directive: {action_type}", "ACTION")
            
            # Process actions
            result = None
            error_message = None
            
            try:
                # 1. OPEN APPLICATION DIRECTIVE
                if action_type == "open_app":
                    app_name = args.get("name", "").lower()
                    url = args.get("url", "")
                    
                    if url:
                        log_message(f"Opening web link in default browser: {url}", "INFO")
                        webbrowser.open(url)
                        result = f"Successfully launched browser redirection for {url}"
                    elif app_name:
                        log_message(f"Attempting to launch app shortcut: {app_name}", "INFO")
                        result = self._launch_local_app(app_name)
                    else:
                        error_message = "Omitted mandatory 'name' or 'url' parameters."

                # 2. TYPE TEXT DIRECTIVE (KEYBOARD CONTROL)
                elif action_type == "type_text":
                    text = args.get("text", "")
                    if not HAS_PYAUTOGUI:
                        error_message = "PyAutoGUI automation package is not installed."
                    elif not text:
                        error_message = "Missing 'text' key inside typed payload parameters."
                    else:
                        log_message(f"Simulating keystrokes typing: '{text}'", "INFO")
                        pyautogui.write(text, interval=0.01)
                        result = f"Successfully typed text segment of length {len(text)}."

                # 3. PRESS KEY OR COMBINATION DIRECTIVE
                elif action_type == "press_key":
                    key = args.get("key", "")
                    modifiers = args.get("modifiers", []) # e.g. ["ctrl", "alt"]
                    
                    if not HAS_PYAUTOGUI:
                        error_message = "PyAutoGUI automation package is not installed."
                    elif not key:
                        error_message = "Omitted mandatory target 'key' to click or press."
                    else:
                        log_message(f"Simulating keypress: key='{key}', modifiers={modifiers}", "INFO")
                        if modifiers:
                            keys_to_press = modifiers + [key]
                            pyautogui.hotkey(*keys_to_press)
                        else:
                            pyautogui.press(key)
                        result = f"Successfully pressed key sequence: {modifiers + [key] if modifiers else key}"

                # 4. MOUSE CLICK DIRECTIVE
                elif action_type == "click":
                    x = args.get("x")
                    y = args.get("y")
                    double = args.get("double", False)
                    button = args.get("button", "left") # left, right, middle
                    
                    if not HAS_PYAUTOGUI:
                        error_message = "PyAutoGUI automation package is not installed."
                    else:
                        if x is not None and y is not None:
                            log_message(f"Moving mouse to position ({x}, {y}) and clicking (double={double}, button={button})", "INFO")
                            if double:
                                pyautogui.doubleClick(x=x, y=y, button=button)
                            else:
                                pyautogui.click(x=x, y=y, button=button)
                            result = f"Clicked mouse successfully at ({x}, {y})."
                        else:
                            # Click at current mouse location
                            log_message(f"Clicking mouse at current cursor position (double={double}, button={button})", "INFO")
                            if double:
                                pyautogui.doubleClick(button=button)
                            else:
                                pyautogui.click(button=button)
                            result = "Clicked mouse successfully at current cursor coordinates."

                # 5. MOUSE MOVE DIRECTIVE
                elif action_type == "mouse_move":
                    x = args.get("x")
                    y = args.get("y")
                    duration = args.get("duration", 0.1)
                    
                    if not HAS_PYAUTOGUI:
                        error_message = "PyAutoGUI automation package is not installed."
                    elif x is None or y is None:
                        error_message = "Coordinates 'x' and 'y' are required."
                    else:
                        log_message(f"Moving mouse cursor to position ({x}, {y}) over {duration}s", "INFO")
                        pyautogui.moveTo(x, y, duration=duration)
                        result = f"Successfully moved mouse cursor coordinates to ({x}, {y})."

                # 6. MOUSE SCROLL DIRECTIVE
                elif action_type == "scroll":
                    amount = args.get("amount", -200) # Negative is scroll down, positive is scroll up
                    
                    if not HAS_PYAUTOGUI:
                        error_message = "PyAutoGUI automation package is not installed."
                    else:
                        log_message(f"Simulating vertical scrolling displacement: {amount}", "INFO")
                        pyautogui.scroll(amount)
                        result = f"Dispatched scroll vertical tick: {amount}"

                # 7. SCREENSHOT GRAB DIRECTIVE (BASE64 TRANSMISSION)
                elif action_type == "screenshot":
                    if not HAS_PILLOW:
                        error_message = "Pillow library is required for taking screenshots."
                    else:
                        log_message("Generating live desktop visual screen grab...", "INFO")
                        # Capture screen frame
                        img = ImageGrab.grab() if platform.system() == "Windows" or platform.system() == "Darwin" else None
                        
                        # General fallback screenshot if ImageGrab is missing or has platform limitations
                        if img is None and HAS_PYAUTOGUI:
                            img = pyautogui.screenshot()
                            
                        if img is not None:
                            # Resize to reasonable dimensions if requested to preserve speed
                            max_size = args.get("max_size", 1024)
                            if max(img.size) > max_size:
                                img.thumbnail((max_size, max_size))
                                
                            buffered = BytesIO()
                            img.save(buffered, format="JPEG", quality=75)
                            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                            
                            result = {
                                "screenshot": img_str,
                                "format": "image/jpeg",
                                "dimensions": img.size
                            }
                            log_message("Visual screen capture encoded and streamed successfully.", "SUCCESS")
                        else:
                            error_message = "Unable to invoke screen capture driver on this platform."

                # 8. MEDIA KEYS DIRECTIVE
                elif action_type == "media_control":
                    cmd = args.get("command", "").lower() # playpause, volumeup, volumedown, volumemute, nexttrack, prevtrack
                    if not HAS_PYAUTOGUI:
                        error_message = "PyAutoGUI automation package is not installed."
                    elif not cmd:
                        error_message = "Omitted 'command' parameter inside media request."
                    else:
                        log_message(f"Triggering media key macro: {cmd}", "INFO")
                        # PyAutoGUI handles specialized media keypress codes natively on Windows/macOS
                        pyautogui.press(cmd)
                        result = f"Simulated hardware key command: '{cmd}'"

                # === HOLOGRAPHIC PHONE LINK (ADB INTEGRATION) ===
                elif action_type == "phone_status":
                    code, stdout, stderr = self._run_adb_command(["devices"])
                    lines = stdout.decode("utf-8").strip().split("\n")
                    devices = []
                    for line in lines[1:]: # skip first line "List of devices attached"
                        if not line.strip():
                            continue
                        parts = line.split()
                        if len(parts) >= 2:
                            device_id = parts[0]
                            state = parts[1]
                            
                            # Try to get device model
                            model = "Unknown Model"
                            try:
                                _, m_out, _ = self._run_adb_command(["-s", device_id, "shell", "getprop", "ro.product.model"])
                                model = m_out.decode("utf-8").strip() or "Android Device"
                            except Exception:
                                pass
                                
                            devices.append({
                                "id": device_id,
                                "state": state,
                                "model": model
                            })
                    result = {
                        "connected": len(devices) > 0,
                        "devices": devices,
                        "adb_available": True
                    }
                    log_message(f"Fetched phone link status: {len(devices)} device(s) found.", "SUCCESS")

                elif action_type == "phone_screenshot":
                    code, stdout, stderr = self._run_adb_command(["exec-out", "screencap", "-p"])
                    if code == 0 and len(stdout) > 0:
                        img_str = base64.b64encode(stdout).decode("utf-8")
                        result = {
                            "screenshot": img_str,
                            "format": "image/png"
                        }
                        log_message("Successfully generated live phone screen capture.", "SUCCESS")
                    else:
                        error_msg = stderr.decode('utf-8', errors='ignore') or "Verify device status."
                        error_message = f"Failed to capture phone screen: {error_msg}"

                elif action_type == "phone_click":
                    x = args.get("x")
                    y = args.get("y")
                    if x is None or y is None:
                        error_message = "Coordinates 'x' and 'y' are required for phone clicking."
                    else:
                        log_message(f"Simulating touch tap on phone at ({x}, {y})", "INFO")
                        code, stdout, stderr = self._run_adb_command(["shell", "input", "tap", str(x), str(y)])
                        if code == 0:
                            result = f"Successfully tapped phone screen at ({x}, {y})."
                        else:
                            error_message = f"ADB input tap failed: {stderr.decode('utf-8', errors='ignore')}"

                elif action_type == "phone_type":
                    text = args.get("text", "")
                    if not text:
                        error_message = "No text provided to type on the phone."
                    else:
                        escaped_text = text.replace(" ", "%s")
                        log_message(f"Simulating key typing on phone: '{text}'", "INFO")
                        code, stdout, stderr = self._run_adb_command(["shell", "input", "text", escaped_text])
                        if code == 0:
                            result = f"Successfully typed text on phone: {text}"
                        else:
                            error_message = f"ADB input text failed: {stderr.decode('utf-8', errors='ignore')}"

                elif action_type == "phone_key":
                    key_code = args.get("key_code")
                    if key_code is None:
                        error_message = "Key code is required for phone key events."
                    else:
                        log_message(f"Simulating hardware key press on phone: key_code={key_code}", "INFO")
                        code, stdout, stderr = self._run_adb_command(["shell", "input", "keyevent", str(key_code)])
                        if code == 0:
                            result = f"Successfully sent phone keyevent: {key_code}"
                        else:
                            error_message = f"ADB keyevent failed: {stderr.decode('utf-8', errors='ignore')}"

                elif action_type == "phone_swipe":
                    x1 = args.get("x1")
                    y1 = args.get("y1")
                    x2 = args.get("x2")
                    y2 = args.get("y2")
                    duration = args.get("duration", 300)
                    if x1 is None or y1 is None or x2 is None or y2 is None:
                        error_message = "Swipe coordinates 'x1', 'y1', 'x2', 'y2' are required."
                    else:
                        log_message(f"Simulating swipe gesture on phone from ({x1}, {y1}) to ({x2}, {y2}) over {duration}ms", "INFO")
                        code, stdout, stderr = self._run_adb_command(["shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration)])
                        if code == 0:
                            result = "Successfully swiped phone screen."
                        else:
                            error_message = f"ADB swipe failed: {stderr.decode('utf-8', errors='ignore')}"

                elif action_type == "phone_open_app":
                    package = args.get("package", "")
                    url = args.get("url", "")
                    if url:
                        log_message(f"Redirection web link on phone: {url}", "INFO")
                        code, stdout, stderr = self._run_adb_command(["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url])
                        if code == 0:
                            result = f"Successfully opened link '{url}' on phone."
                        else:
                            error_message = f"ADB am start url failed: {stderr.decode('utf-8', errors='ignore')}"
                    elif package:
                        log_message(f"Attempting to launch phone app bundle: {package}", "INFO")
                        code, stdout, stderr = self._run_adb_command(["shell", "monkey", "-p", package, "-c", "android.intent.category.LAUNCHER", "1"])
                        if code == 0:
                            result = f"Successfully launched package '{package}' on phone."
                        else:
                            error_message = f"ADB monkey app start failed: {stderr.decode('utf-8', errors='ignore')}. Check if package is installed on device."
                    else:
                        error_message = "Package name or URL is required to launch app on phone."

                elif action_type == "phone_install_companion":
                    code, stdout, stderr = self._run_adb_command(["devices"])
                    lines = stdout.decode("utf-8", errors="ignore").strip().split("\n")
                    connected = False
                    for line in lines[1:]:
                        if line.strip() and "device" in line:
                            connected = True
                            break
                    
                    if not connected:
                        error_message = "No USB-connected Android phone detected. Please connect your phone with USB debugging enabled."
                    else:
                        log_message("Starting companion APK installation...", "INFO")
                        apk_path = "companion-app.apk"
                        
                        if not os.path.exists(apk_path):
                            log_message("companion-app.apk not found locally. Attempting to download companion app...", "INFO")
                            try:
                                import urllib.request
                                url = "https://raw.githubusercontent.com/fabi943/TinyBrowser/master/app/release/app-release.apk"
                                urllib.request.urlretrieve(url, apk_path)
                                log_message("Successfully downloaded companion app.", "SUCCESS")
                            except Exception as dl_err:
                                log_message(f"Could not auto-download companion APK: {str(dl_err)}", "WARNING")
                        
                        if os.path.exists(apk_path):
                            log_message(f"Executing ADB installation: adb install -r {apk_path}", "INFO")
                            icode, istdout, istderr = self._run_adb_command(["install", "-r", apk_path])
                            if icode == 0:
                                result = "Companion App installed successfully on your Android phone! Open it on your phone to configure the API key and start independent commands."
                                log_message("Companion APK installed successfully via ADB.", "SUCCESS")
                            else:
                                error_message = f"ADB installation failed: {istderr.decode('utf-8', errors='ignore')}"
                        else:
                            error_message = "Companion APK file is missing. Please place 'companion-app.apk' in the bridge directory."

                # === DESKTOP SPECIALIZED AGENTS HANDLERS ===
                elif action_type == "file_control":
                    sub_action = args.get("action", "").lower()
                    path = args.get("path", "")
                    destination = args.get("destination", "")
                    content = args.get("content", "")
                    query = args.get("query", "")
                    
                    def resolve_path(p):
                        if not p:
                            return os.path.expanduser("~/Desktop")
                        if os.path.isabs(p) or "/" in p or "\\" in p:
                            return p
                        return os.path.join(os.path.expanduser("~/Desktop"), p)

                    target_path = resolve_path(path)
                    dest_path = resolve_path(destination) if destination else None

                    if sub_action == "list_desktop":
                        desktop_dir = os.path.expanduser("~/Desktop")
                        try:
                            files = os.listdir(desktop_dir)
                            res_files = []
                            for f in files:
                                full = os.path.join(desktop_dir, f)
                                try:
                                    size = os.path.getsize(full) if os.path.isfile(full) else 0
                                except Exception:
                                    size = 0
                                res_files.append({
                                    "name": f,
                                    "is_dir": os.path.isdir(full),
                                    "size": size
                                })
                            result = {"files": res_files, "folder": desktop_dir}
                        except Exception as e:
                            error_message = f"Failed to list desktop directory: {str(e)}"
                    elif sub_action == "create_file":
                        try:
                            with open(target_path, "w", encoding="utf-8") as f:
                                f.write(content)
                            result = f"Successfully created file at {target_path}"
                        except Exception as e:
                            error_message = f"Failed to create file: {str(e)}"
                    elif sub_action == "read_file":
                        try:
                            with open(target_path, "r", encoding="utf-8", errors="ignore") as f:
                                data = f.read()
                            result = {"content": data, "path": target_path}
                        except Exception as e:
                            error_message = f"Failed to read file: {str(e)}"
                    elif sub_action == "create_folder":
                        try:
                            os.makedirs(target_path, exist_ok=True)
                            result = f"Successfully created folder at {target_path}"
                        except Exception as e:
                            error_message = f"Failed to create folder: {str(e)}"
                    elif sub_action == "delete":
                        try:
                            if os.path.isdir(target_path):
                                shutil.rmtree(target_path)
                                result = f"Successfully deleted folder {target_path}"
                            else:
                                os.remove(target_path)
                                result = f"Successfully deleted file {target_path}"
                        except Exception as e:
                            error_message = f"Failed to delete target: {str(e)}"
                    elif sub_action in ["rename", "move"]:
                        try:
                            shutil.move(target_path, dest_path)
                            result = f"Successfully moved {target_path} to {dest_path}"
                        except Exception as e:
                            error_message = f"Failed to move: {str(e)}"
                    elif sub_action == "copy":
                        try:
                            if os.path.isdir(target_path):
                                shutil.copytree(target_path, dest_path)
                            else:
                                shutil.copy(target_path, dest_path)
                            result = f"Successfully copied {target_path} to {dest_path}"
                        except Exception as e:
                            error_message = f"Failed to copy: {str(e)}"
                    elif sub_action == "search":
                        try:
                            search_dir = target_path if os.path.isdir(target_path) else os.path.expanduser("~/Desktop")
                            found = []
                            for root, dirs, files in os.walk(search_dir):
                                for name in files + dirs:
                                    if query.lower() in name.lower():
                                        found.append(os.path.join(root, name))
                            result = {"matches": found}
                        except Exception as e:
                            error_message = f"Search failed: {str(e)}"
                    else:
                        error_message = f"Unsupported file sub-action: {sub_action}"

                elif action_type == "system_control":
                    sub_action = args.get("action", "").lower()
                    level = args.get("level")

                    if sub_action == "set_volume":
                        if platform.system() == "Windows" and level is not None:
                            ps_cmd = f"& {{ (New-Object -ComObject WScript.Shell).SendKeys([char]174)*50; (New-Object -ComObject WScript.Shell).SendKeys([char]175)*{int(level/2)} }}"
                            subprocess.Popen(["powershell", "-Command", ps_cmd], shell=True)
                            result = f"Volume adjusted to approximately {level}%"
                        else:
                            result = f"Volume set command {level}% triggered."
                    elif sub_action == "increase_volume":
                        if HAS_PYAUTOGUI:
                            for _ in range(5):
                                pyautogui.press("volumeup")
                            result = "Volume increased"
                        else:
                            result = "Volume up triggered"
                    elif sub_action == "decrease_volume":
                        if HAS_PYAUTOGUI:
                            for _ in range(5):
                                pyautogui.press("volumedown")
                            result = "Volume decreased"
                        else:
                            result = "Volume down triggered"
                    elif sub_action in ["mute", "unmute"]:
                        if HAS_PYAUTOGUI:
                            pyautogui.press("volumemute")
                            result = "Mute/Unmute toggle triggered"
                        else:
                            result = "Volume mute triggered"
                    elif sub_action == "lock_pc":
                        if platform.system() == "Windows":
                            subprocess.Popen("rundll32.exe user32.dll,LockWorkStation", shell=True)
                        elif platform.system() == "Darwin":
                            subprocess.Popen("pmset displaysleepnow", shell=True)
                        result = "Lock PC command executed"
                    elif sub_action == "sleep":
                        if platform.system() == "Windows":
                            subprocess.Popen("rundll32.exe powrprof.dll,SetSuspendState 0,1,0", shell=True)
                        elif platform.system() == "Darwin":
                            subprocess.Popen("osascript -e 'tell application \"System Events\" to sleep'", shell=True)
                        result = "PC put to sleep mode"
                    elif sub_action == "restart":
                        if platform.system() == "Windows":
                            subprocess.Popen("shutdown /r /t 0", shell=True)
                        elif platform.system() == "Darwin":
                            subprocess.Popen("osascript -e 'tell application \"System Events\" to restart'", shell=True)
                        result = "PC restart sequence initiated"
                    elif sub_action == "shutdown":
                        if platform.system() == "Windows":
                            subprocess.Popen("shutdown /s /t 0", shell=True)
                        elif platform.system() == "Darwin":
                            subprocess.Popen("osascript -e 'tell application \"System Events\" to shut down'", shell=True)
                        result = "PC shutdown sequence initiated"
                    elif sub_action == "set_brightness":
                        if platform.system() == "Windows" and level is not None:
                            ps_cmd = f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {int(level)})"
                            subprocess.Popen(["powershell", "-Command", ps_cmd], shell=True)
                            result = f"Brightness set to {level}%"
                        else:
                            result = f"Brightness setting {level}% triggered."
                    else:
                        error_message = f"Unsupported system sub-action: {sub_action}"

                elif action_type == "window_control":
                    sub_action = args.get("action", "").lower()
                    target = args.get("target", "")

                    if platform.system() == "Windows":
                        if sub_action == "list":
                            ps_cmd = 'Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json'
                            proc = subprocess.Popen(["powershell", "-Command", ps_cmd], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                            stdout, _ = proc.communicate()
                            try:
                                result = json.loads(stdout.decode("utf-8", errors="ignore"))
                            except Exception:
                                result = stdout.decode("utf-8", errors="ignore")
                        elif sub_action == "close":
                            if target:
                                ps_cmd = f'Stop-Process -Name "{target}" -Force'
                                subprocess.Popen(["powershell", "-Command", ps_cmd], shell=True)
                                result = f"Closed processes matching: {target}"
                            else:
                                error_message = "No window target process name provided for closing"
                        elif sub_action in ["minimize", "maximize", "restore", "activate"]:
                            if target:
                                cmd_show = {"minimize": 2, "maximize": 3, "restore": 9, "activate": 5}[sub_action]
                                ps_cmd = f'''
                                $code = @'
                                [DllImport("user32.dll")]
                                public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                                [DllImport("user32.dll")]
                                public static extern bool SetForegroundWindow(IntPtr hWnd);
                                '@
                                Add-Type -TypeDefinition $code -Namespace Win32API -Name WindowMethods
                                $p = Get-Process | Where-Object {{ $_.ProcessName -like "*{target}*" -or $_.MainWindowTitle -like "*{target}*" }} | Select-Object -First 1
                                if ($p) {{
                                    [Win32API.WindowMethods]::ShowWindowAsync($p.MainWindowHandle, {cmd_show})
                                    [Win32API.WindowMethods]::SetForegroundWindow($p.MainWindowHandle)
                                }}
                                '''
                                subprocess.Popen(["powershell", "-Command", ps_cmd], shell=True)
                                result = f"Applied window state {sub_action} to target '{target}'"
                            else:
                                error_message = "No window target provided"
                    else:
                        result = "Window operations are optimized for Windows OS."

                elif action_type == "notepad_control":
                    sub_action = args.get("action", "").lower()
                    filename = args.get("filename", "")

                    if not HAS_PYAUTOGUI:
                        error_message = "PyAutoGUI package is required to perform notepad control"
                    else:
                        if sub_action == "save_and_close":
                            pyautogui.hotkey("ctrl", "s")
                            time.sleep(0.5)
                            if filename:
                                pyautogui.write(filename, interval=0.01)
                                pyautogui.press("enter")
                                time.sleep(0.5)
                            pyautogui.hotkey("alt", "f4")
                            result = "Saved and closed Notepad"
                        elif sub_action == "close_without_saving":
                            pyautogui.hotkey("alt", "f4")
                            time.sleep(0.5)
                            pyautogui.press("n")
                            result = "Closed Notepad without saving"
                        elif sub_action == "save_as":
                            pyautogui.hotkey("ctrl", "shift", "s")
                            time.sleep(0.5)
                            if filename:
                                pyautogui.write(filename, interval=0.01)
                                pyautogui.press("enter")
                            result = f"Executed Notepad Save As: {filename}"

                else:
                    error_message = f"Instruction protocol type '{action_type}' is unrecognized."

            except Exception as ex:
                error_message = f"Execution exception during bridge handshake: {str(ex)}"
                log_message(error_message, "ERROR")

            # Format Response
            self.send_response(200 if not error_message else 500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            if error_message:
                self.wfile.write(json.dumps({"success": False, "error": error_message}).encode("utf-8"))
            else:
                self.wfile.write(json.dumps({"success": True, "result": result}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Endpoint not found.")

    def _launch_local_app(self, name):
        """
        Cross-platform application launching helper.
        Supports Windows, macOS, and standard Linux desktops.
        Highly tolerant of user phrasing, case variations, and extra words.
        """
        sys_platform = platform.system()
        log_message(f"Identifying system driver maps for OS: {sys_platform}. Target: '{name}'", "INFO")
        
        # Clean and normalize the application name
        cleaned = str(name).strip().lower()
        
        # Strip common verb prefixes
        for prefix in ["open ", "launch ", "run ", "start ", "go to "]:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):].strip()
                
        # Strip common suffixes
        for suffix in [".exe", " app", ".app"]:
            if cleaned.endswith(suffix):
                cleaned = cleaned[:-len(suffix)].strip()

        # Handle website shortcuts
        web_shortcuts = {
            "youtube": "https://youtube.com",
            "google": "https://google.com",
            "facebook": "https://facebook.com",
            "twitter": "https://twitter.com",
            "github": "https://github.com",
            "gmail": "https://mail.google.com",
            "instagram": "https://instagram.com"
        }
        
        if cleaned in web_shortcuts or cleaned.startswith("http://") or cleaned.startswith("https://") or cleaned.endswith(".com") or cleaned.endswith(".org") or cleaned.endswith(".net") or cleaned.endswith(".co"):
            url = web_shortcuts.get(cleaned, cleaned)
            if not url.startswith("http://") and not url.startswith("https://"):
                url = "https://" + url
            log_message(f"Action parsed as web link navigation. Redirecting to URL: {url}", "INFO")
            if sys_platform == "Windows":
                subprocess.Popen(f"start {url}", shell=True)
            elif sys_platform == "Darwin":
                subprocess.Popen(f"open {url}", shell=True)
            else:
                subprocess.Popen(f"xdg-open {url}", shell=True)
            return f"Opened web URL node: {url}"

        # 1. WINDOWS APPLICATION COMMANDS
        if sys_platform == "Windows":
            apps_map = {
                "notepad": "notepad.exe",
                "calculator": "calc.exe",
                "calc": "calc.exe",
                "paint": "mspaint.exe",
                "mspaint": "mspaint.exe",
                "cmd": "cmd.exe /c start cmd.exe",
                "command prompt": "cmd.exe /c start cmd.exe",
                "terminal": "wt.exe",
                "powershell": "powershell.exe",
                "explorer": "explorer.exe",
                "my computer": "explorer.exe",
                "this pc": "explorer.exe",
                "chrome": "start chrome",
                "google chrome": "start chrome",
                "edge": "start msedge",
                "microsoft edge": "start msedge",
                "word": "start winword",
                "excel": "start excel",
                "powerpoint": "start powerpnt",
                "task manager": "taskmgr.exe",
                "taskmgr": "taskmgr.exe",
                "settings": "start ms-settings:",
                "control panel": "control.exe",
                "write": "write.exe"
            }
            cmd = apps_map.get(cleaned)
            if cmd:
                subprocess.Popen(cmd, shell=True)
                return f"Spawned Windows process thread: {cmd}"
            else:
                # Direct launch attempt via shell execution
                try:
                    subprocess.Popen(f"start {cleaned}", shell=True)
                    return f"Dispatched generic shell launcher: {cleaned}"
                except Exception as e:
                    # Try raw command execution as fallback
                    subprocess.Popen(cleaned, shell=True)
                    return f"Dispatched raw fallback launcher: {cleaned}"

        # 2. MACOS APPLICATION COMMANDS
        elif sys_platform == "Darwin":
            apps_map = {
                "notepad": "open -a TextEdit",
                "textedit": "open -a TextEdit",
                "calculator": "open -a Calculator",
                "calc": "open -a Calculator",
                "terminal": "open -a Terminal",
                "safari": "open -a Safari",
                "chrome": "open -a 'Google Chrome'",
                "google chrome": "open -a 'Google Chrome'",
                "finder": "open .",
                "settings": "open /System/Applications/System\\ Settings.app",
                "system preferences": "open /System/Applications/System\\ Settings.app"
            }
            cmd = apps_map.get(cleaned)
            if cmd:
                subprocess.Popen(cmd, shell=True)
                return f"Spawned macOS application process: {cmd}"
            else:
                # Direct open attempt for macOS app files
                subprocess.Popen(f"open -a '{cleaned}'", shell=True)
                return f"Dispatched Darwin open thread for app bundle: {cleaned}"

        # 3. LINUX APPLICATION COMMANDS
        else:
            apps_map = {
                "notepad": "gedit",
                "textedit": "gedit",
                "calculator": "gnome-calculator",
                "calc": "gnome-calculator",
                "terminal": "x-terminal-emulator",
                "chrome": "google-chrome",
                "google chrome": "google-chrome",
                "firefox": "firefox"
            }
            cmd = apps_map.get(cleaned)
            if cmd:
                subprocess.Popen(cmd, shell=True)
                return f"Spawned Linux shell executable: {cmd}"
            else:
                # Run binary directly from PATH
                subprocess.Popen(cleaned, shell=True)
                return f"Dispatched generic Linux subprocess invocation: {cleaned}"

    def _run_adb_command(self, cmd_args):
        # Helper to execute ADB (Android Debug Bridge) command line actions
        # First check for local platform-tools/adb or adb in current working directory
        sys_platform = platform.system()
        local_adb = None
        
        candidates = []
        if sys_platform == "Windows":
            candidates = [
                os.path.join(os.getcwd(), "platform-tools", "adb.exe"),
                os.path.join(os.getcwd(), "adb.exe"),
                "adb.exe"
            ]
        else:
            candidates = [
                os.path.join(os.getcwd(), "platform-tools", "adb"),
                os.path.join(os.getcwd(), "adb"),
                "adb"
            ]
            
        for cand in candidates:
            if os.path.exists(cand) and os.path.isfile(cand):
                local_adb = cand
                break
                
        adb_binary = local_adb if local_adb else "adb"
        full_cmd = [adb_binary] + cmd_args
        
        try:
            proc = subprocess.Popen(full_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = proc.communicate()
            return proc.returncode, stdout, stderr
        except FileNotFoundError:
            raise Exception("ADB (Android Debug Bridge) executable is not installed. For a one-click automated setup, please run 'setup_max_ai.bat' (Windows) or 'setup_max_ai.sh' (Mac/Linux) which will download and install ADB automatically.")



def run_server():
    server_address = ("127.0.0.1", PORT)
    httpd = HTTPServer(server_address, DesktopBridgeRequestHandler)
    
    log_message(f"======================================================", "INFO")
    log_message(f"🚀 Max-AI OS Local Desktop Control Bridge Running!", "SUCCESS")
    log_message(f"📡 Secure Loopback Address: http://127.0.0.1:{PORT}", "INFO")
    log_message(f"🔑 Persistent Security Token: {authToken}", "SUCCESS")
    log_message(f"🔒 Authenticate frames using bearer/query parameter 'token'", "INFO")
    log_message(f"⚠️  Binding restriction enforces local client-only connections.", "INFO")
    log_message(f"📋 Fail-Safe Warning: Move mouse cursor to any screen corner", "WARNING")
    log_message(f"   to abort immediately in case of unexpected loop behavior.", "WARNING")
    log_message(f"======================================================", "INFO")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        log_message("Desktop controller shutting down gracefully. Safe journey!", "WARNING")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
