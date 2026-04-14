#!/bin/bash
# Simple Deployment Script for Nexus VPN (Python Version)

echo "Starting deployment..."

# 1. Update system packages
sudo apt update -y

# 2. Install Python 3, pip, and venv if not present
sudo apt install -y python3 python3-pip python3-venv curl wireguard

# 3. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Make setup script executable
chmod +x setup_wireguard.sh

echo ""
echo "Installation complete!"
echo "To run the server, type:"
echo "sudo ./venv/bin/python app.py"
echo ""
echo "Then visit your server's IP address in a browser (Port 5000)."
echo "If you want to run it in the background, you can use 'screen' or 'nohup'."
