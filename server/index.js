const express = require('express');
const cors = require('cors');
const shell = require('shelljs');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const WG_PATH = '/etc/wireguard';
const SETUP_SCRIPT = path.join(__dirname, '../setup_wireguard.sh');

// Helper to check if WireGuard is installed
const isWgInstalled = () => shell.which('wg');

app.get('/api/status', (appReq, res) => {
    const status = {
        installed: !!isWgInstalled(),
        running: false,
        interface: 'wg0',
        publicIp: 'Fetching...',
        activeClients: 0
    };

    if (status.installed) {
        const wgShow = shell.exec('wg show', { silent: true }).stdout;
        status.running = wgShow.includes('interface: wg0');

        // Mocking some data if not on a real server
        if (!status.running && process.env.NODE_ENV !== 'production') {
            status.running = true;
            status.publicIp = '1.2.3.4';
            status.activeClients = 1;
        }
    }

    res.json(status);
});

app.get('/api/config', async (appReq, res) => {
    try {
        let configContent = '';
        if (fs.existsSync(path.join(WG_PATH, 'client.conf'))) {
            configContent = fs.readFileSync(path.join(WG_PATH, 'client.conf'), 'utf8');
        } else if (process.env.NODE_ENV !== 'production') {
            configContent = `[Interface]\nPrivateKey = MOCKED_KEY\nAddress = 10.0.0.2/32\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = SERVER_MOCKED_KEY\nEndpoint = 1.2.3.4:51820\nAllowedIPs = 0.0.0.0/0`;
        }

        if (!configContent) {
            return res.status(404).json({ error: 'Configuration not found. Run setup first.' });
        }

        const qrCode = await QRCode.toDataURL(configContent);
        res.json({ config: configContent, qrCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/setup', (appReq, res) => {
    // Only allow setup if not already running or in dev mode
    if (process.env.NODE_ENV === 'production') {
        const result = shell.exec(`sudo bash ${SETUP_SCRIPT}`, { silent: false });
        if (result.code !== 0) {
            return res.status(500).json({ error: 'Setup failed', details: result.stderr });
        }
    }
    res.json({ message: 'Setup initiated successfully' });
});

app.listen(PORT, () => {
    console.log(`VPN Management API running on port ${PORT}`);
});
