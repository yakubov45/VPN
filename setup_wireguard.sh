#!/bin/bash

# Senior DevOps WireGuard Installer for Ubuntu 22.04 LTS
# Focus: High-Security, No-Logs, DNS Leak Protection

set -e

# --- Configuration (Adjust as needed) ---
WG_PORT=51820
WG_ADDR=10.0.0.1/24
CLIENT_ADDR=10.0.0.2/32
DNS_SERVER="1.1.1.1, 1.0.0.1" # Cloudflare Privacy DNS
SERVER_INTERFACE=$(ip route get 8.8.8.8 | awk -- '{printf $5; exit}')

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting WireGuard Installation...${NC}"

# 1. Update and Install Dependencies
echo -e "${GREEN}Updating system and installing WireGuard...${NC}"
apt update && apt upgrade -y
apt install -y wireguard qrencode curl ufw

# 2. Enable IP Forwarding
echo -e "${GREEN}Enabling IP forwarding...${NC}"
echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-wireguard-forward.conf
sysctl -p /etc/sysctl.d/99-wireguard-forward.conf

# 3. Generate Keys
echo -e "${GREEN}Generating keys...${NC}"
mkdir -p /etc/wireguard
cd /etc/wireguard
umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key
wg genkey | tee client_private.key | wg pubkey > client_public.key

SERVER_PRIV=$(cat server_private.key)
SERVER_PUB=$(cat server_public.key)
CLIENT_PRIV=$(cat client_private.key)
CLIENT_PUB=$(cat client_public.key)

# 4. Configure Server (wg0.conf)
echo -e "${GREEN}Configuring server (wg0.conf)...${NC}"
cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
PrivateKey = ${SERVER_PRIV}
Address = ${WG_ADDR}
ListenPort = ${WG_PORT}
PostUp = ufw route allow in on wg0 out on ${SERVER_INTERFACE}
PostUp = iptables -t nat -I POSTROUTING -o ${SERVER_INTERFACE} -j MASQUERADE
PostDown = ufw route delete allow in on wg0 out on ${SERVER_INTERFACE}
PostDown = iptables -t nat -D POSTROUTING -o ${SERVER_INTERFACE} -j MASQUERADE

# Peer: Client 1
[Peer]
PublicKey = ${CLIENT_PUB}
AllowedIPs = ${CLIENT_ADDR}
EOF

# 5. Setup Firewall (UFW)
echo -e "${GREEN}Configuring UFW...${NC}"
ufw allow ssh
ufw allow ${WG_PORT}/udp
ufw --force enable

# 6. Start WireGuard
echo -e "${GREEN}Starting wg0 interface...${NC}"
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# 7. Generate Client Config
PUBLIC_IP=$(curl -s https://ifconfig.me)
cat > /etc/wireguard/client.conf <<EOF
[Interface]
PrivateKey = ${CLIENT_PRIV}
Address = ${CLIENT_ADDR}
DNS = ${DNS_SERVER}

[Peer]
PublicKey = ${SERVER_PUB}
Endpoint = ${PUBLIC_IP}:${WG_PORT}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

echo -e "${GREEN}--- Installation Complete ---${NC}"
echo -e "${GREEN}Client Configuration (/etc/wireguard/client.conf):${NC}"
cat /etc/wireguard/client.conf
echo ""
echo -e "${GREEN}Scan QR Code for Mobile Device:${NC}"
qrencode -t ansiutf8 < /etc/wireguard/client.conf

echo -e "${RED}IMPORTANT: Securely transfer client.conf and delete it from the server to maintain 'No-Log' integrity.${NC}"
