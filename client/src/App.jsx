import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Download, Settings, Server, Globe, Cpu, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupRunning, setSetupRunning] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config`);
      const data = await res.json();
      setConfig(data);
      if (data.config) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };

  const runSetup = async () => {
    setSetupRunning(true);
    try {
      await fetch(`${API_BASE}/setup`, { method: 'POST' });
      setTimeout(fetchStatus, 5000);
    } catch (err) {
      console.error('Setup failed', err);
    } finally {
      setSetupRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Shield size={64} color="#6366f1" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 space-y-12">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <Lock className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nexus VPN</h1>
            <p className="text-gray-400 text-sm">Military-Grade Encryption Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`status-badge ${status?.running ? 'status-active' : 'status-inactive'}`}>
            {status?.running ? 'Connected' : 'Disconnected'}
          </div>
          <button onClick={fetchStatus} className="p-2 bg-transparent border-white/10 hover:border-white/20 shadow-none">
            <Activity size={18} />
          </button>
        </div>
      </motion.header>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Status Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="glass-card col-span-2 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Server size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">Server Status</span>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">Public IP</p>
                <p className="text-2xl font-mono font-bold">{status?.publicIp || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">Interface</p>
                <p className="text-2xl font-mono font-bold">{status?.interface || 'wg0'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
            <button
              onClick={runSetup}
              disabled={setupRunning}
              className="flex-1 bg-white text-black hover:bg-gray-200"
            >
              {setupRunning ? 'Initializing...' : 'Start Global Relay'}
            </button>
            <button onClick={fetchConfig} className="flex-1 flex items-center justify-center gap-2">
              <Download size={18} />
              Generate Config
            </button>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="glass-card bg-indigo-600/10 border-indigo-500/20"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Globe size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">Active Region</span>
            </div>
            <div>
              <p className="text-3xl font-bold">AWS Cloud</p>
              <p className="text-gray-400 text-sm mt-1">us-east-1 (N. Virginia)</p>
            </div>
            <div className="pt-4 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Cpu size={12} /> t3.micro</span>
              <span className="flex items-center gap-1"><Shield size={12} /> WireGuard</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Config section */}
      <AnimatePresence>
        {config && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Device Configuration</h3>
                  <p className="text-gray-400 text-sm">Download or scan this QR code with the WireGuard app on your mobile device.</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4 font-mono text-xs max-h-48 overflow-y-auto border border-white/5">
                  <pre>{config.config}</pre>
                </div>
                <button className="w-full flex items-center justify-center gap-2">
                  <Download size={18} /> Download .conf
                </button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <img src={config.qrCode} alt="WireGuard QR Code" className="w-64 h-64 rounded-xl border-8 border-white p-2" />
                <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase">Safe & Encrypted</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-xs">
        <p>© 2026 Nexus VPN Systems. Built for secure global communication.</p>
      </footer>
    </div>
  );
}

export default App;
