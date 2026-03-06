import React, { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import { Terminal, Download, Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

// API configuration - using the same pattern as other pages if exists
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/logs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Format logs from DB to match LogEntry interface if needed
        const formattedLogs = response.data.data.map((log: any) => ({
          id: log._id,
          timestamp: new Date(log.timestamp).toLocaleString(),
          level: log.level,
          message: log.message,
          user: log.user
        }));
        setLogs(formattedLogs);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch system logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/logs/export`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export logs');
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-lg font-medium">Loading system logs...</p>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-100 gap-4 bg-red-900/20 rounded-xl border border-red-500/50 p-8">
        <AlertCircle size={48} />
        <p className="text-xl font-bold">{error}</p>
        <button
          onClick={fetchLogs}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal size={24} /> System Logs
          {!loading && (
            <span className="text-xs font-normal bg-blue-500/20 px-2 py-1 rounded-full border border-blue-500/30">
              {logs.length} entries
            </span>
          )}
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm grow sm:grow-0 justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Clock size={16} />}
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#E6EEF9] border border-blue-200 rounded-lg text-sm font-medium text-[#0E4B5B] hover:bg-white shadow-sm grow sm:grow-0 justify-center"
          >
            <Download size={16} /> Export Logs
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-[#E6EEF9]/10 border border-blue-200/20 p-12 rounded-xl text-center text-white/60 flex flex-col items-center gap-4">
          <Terminal size={48} className="opacity-20" />
          <p>No log entries found in the system monitor.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-[#E6EEF9] rounded-xl shadow-lg overflow-hidden font-mono text-sm border border-blue-200">
            <div className="bg-blue-100/50 px-6 py-3 border-b border-blue-200 flex items-center gap-2">
              <Terminal size={16} className="text-[#0E4B5B]" />
              <span className="text-[#0E4B5B] font-semibold">system_monitor.log</span>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-blue-200">
                    <th className="px-4 py-2 w-48">Timestamp</th>
                    <th className="px-4 py-2 w-24">Level</th>
                    <th className="px-4 py-2">Message</th>
                    <th className="px-4 py-2 w-32">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-200/30 transition-colors">
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.level === 'INFO' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                          log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                            'bg-red-100 text-red-700 border border-red-300'
                          }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-700">{log.message}</td>
                      <td className="px-4 py-2 text-gray-500">{log.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 font-mono text-sm">
            {logs.map((log) => (
              <div key={log.id} className="bg-[#E6EEF9] p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.level === 'INFO' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                    log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                      'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                    {log.level}
                  </span>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Clock size={12} /> {log.timestamp}
                  </span>
                </div>
                <p className="text-gray-800 font-medium leading-snug">
                  {log.message}
                </p>
                <div className="flex items-center gap-2 text-gray-500 text-xs border-t border-blue-200 pt-2 mt-1">
                  <User size={12} />
                  <span>{log.user}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};