from flask import Flask, jsonify, request, render_template
import subprocess
import os
import qrcode
import base64
from io import BytesIO

app = Flask(__name__)

WG_PATH = '/etc/wireguard'
SETUP_SCRIPT = os.path.join(os.path.dirname(__file__), 'setup_wireguard.sh')

def check_wg_installed():
    try:
        subprocess.run(['which', 'wg'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError:
        return False

# Serve the frontend
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status', methods=['GET'])
def get_status():
    installed = check_wg_installed()
    running = False
    
    if installed:
        try:
            result = subprocess.run(['sudo', 'wg', 'show'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if 'interface: wg0' in result.stdout:
                running = True
        except Exception:
            pass

    # Mock data for local testing on Windows
    if os.name == 'nt' or not installed:
        running = True
        installed = True

    return jsonify({
        "installed": installed,
        "running": running,
        "interface": "wg0",
        "publicIp": "Checking...",
        "activeClients": 1 if running else 0
    })

@app.route('/api/config', methods=['GET'])
def get_config():
    client_conf_path = os.path.join(WG_PATH, 'client.conf')
    config_content = ""
    
    if os.path.exists(client_conf_path):
        with open(client_conf_path, 'r') as f:
            config_content = f.read()
    elif os.name == 'nt' or not check_wg_installed():
        # Mock config for Windows/Local
        config_content = "[Interface]\nPrivateKey = MOCKED_KEY\nAddress = 10.0.0.2/32\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = SERVER_MOCKED_KEY\nEndpoint = 1.2.3.4:51820\nAllowedIPs = 0.0.0.0/0\nPersistentKeepalive = 25"
    else:
        return jsonify({"error": "Configuration not found. Run setup first."}), 404

    # Generate QR Code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(config_content)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    qr_data_url = f"data:image/png;base64,{img_str}"

    return jsonify({
        "config": config_content,
        "qrCode": qr_data_url
    })

@app.route('/api/setup', methods=['POST'])
def setup_vpn():
    if os.name != 'nt':
        try:
            subprocess.run(['sudo', 'bash', SETUP_SCRIPT], check=True)
            return jsonify({"message": "Setup initiated successfully"})
        except Exception as e:
            return jsonify({"error": f"Setup failed: {str(e)}"}), 500
    return jsonify({"message": "Mock setup success"})

if __name__ == '__main__':
    # Run on all boundaries, port 80 if possible, fallback to 5000 if not root
    app.run(host='0.0.0.0', port=5000, debug=True)
