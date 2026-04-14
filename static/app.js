let rawConfigContent = "";

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';
            fetchStatus();
        }, 500);
    }, 800);
});

async function fetchStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        const badge = document.getElementById('status-badge');
        const setupBtn = document.getElementById('setup-btn');

        if (data.running) {
            badge.textContent = 'Connected';
            badge.className = 'px-4 py-1 rounded-full text-sm font-semibold uppercase border bg-green-500/10 text-green-500 border-green-500/20';
            setupBtn.textContent = 'Active Server';
            setupBtn.disabled = true;
            document.getElementById('public-ip').textContent = data.publicIp || 'Connected';
        } else {
            badge.textContent = 'Disconnected';
            badge.className = 'px-4 py-1 rounded-full text-sm font-semibold uppercase border bg-red-500/10 text-red-500 border-red-500/20';
            setupBtn.disabled = false;
        }

        document.getElementById('interface-name').textContent = data.interface || 'wg0';
    } catch (err) {
        console.error("Failed to fetch status");
    }
}

async function fetchConfig() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            alert("No configuration found. Please start the server first.");
            return;
        }
        const data = await response.json();

        rawConfigContent = data.config;
        document.getElementById('config-content').textContent = data.config;
        document.getElementById('qr-code').src = data.qrCode;

        const section = document.getElementById('config-section');
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error("Failed to fetch config");
    }
}

async function runSetup() {
    const btn = document.getElementById('setup-btn');
    btn.disabled = true;
    btn.textContent = 'Initializing... (Please wait)';

    try {
        const response = await fetch('/api/setup', { method: 'POST' });
        if (response.ok) {
            btn.textContent = 'Success! Starting...';
            setTimeout(fetchStatus, 3000);
        } else {
            alert("Setup failed check the logs.");
            btn.disabled = false;
            btn.textContent = 'Start Global Relay';
        }
    } catch (err) {
        alert("Failed to reach server.");
        btn.disabled = false;
        btn.textContent = 'Start Global Relay';
    }
}

function downloadConfig() {
    if (!rawConfigContent) return;
    const blob = new Blob([rawConfigContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client.conf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
