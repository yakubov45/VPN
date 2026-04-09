# AWS Cloud Deployment Guide: Nexus VPN

Follow these steps to deploy your private VPN server to AWS.

## 1. Launch EC2 Instance
- **Region**: Choose the region closest to you (e.g., `us-east-1` for USA, `eu-central-1` for Europe).
- **AMI**: Ubuntu 22.04 LTS (64-bit x86).
- **Instance Type**: `t3.micro` (Free Tier eligible).
- **Key Pair**: Create or use an existing one to SSH into the server.

## 2. Configure Security Group
Create a new Security Group with the following rules:
- **SSH (TCP 22)**: Allow from your IP.
- **WireGuard (UDP 51820)**: Allow from Anywhere (0.0.0.0/0).
- **Dashboard (TCP 80/443)**: Allow from Anywhere to access the UI.
- **API (TCP 5000)**: Allow from Anywhere (or restrict to your IP).

## 3. Automatic Setup (UserData)
When launching the instance, expand **Advanced Details** and paste the following into the **User data** field:

```bash
#!/bin/bash
# Update and Install Docker
apt update -y
apt install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# Clone your project (replace with your actual repo or upload files)
mkdir -p /opt/nexus-vpn
cd /opt/nexus-vpn

# [Here you would normally git clone your project]
# For now, we will run the setup_wireguard.sh script
wget https://raw.githubusercontent.com/your-repo/vpn/main/setup_wireguard.sh
bash setup_wireguard.sh
```

## 4. Manual Deployment
If you prefer manual setup:
1. SSH into your instance: `ssh -i key.pem ubuntu@your-ec2-ip`
2. Upload the `setup_wireguard.sh` script.
3. Run it: `sudo bash setup_wireguard.sh`
4. Use the generated QR code or download the `client.conf`.

## 5. Elastic IP (Recommended)
Associate an **Elastic IP** with your instance to ensure the VPN endpoint stays the same even if the instance restarts.
