class NetworkMonitor {
    constructor() {
        this.dataPoints = 50;
        this.updateInterval = 2000;
        this.autoRefresh = true;
        this.startTime = new Date();
        this.charts = {};
        this.data = {
            upload: [],
            download: [],
            latency: [],
            connections: []
        };
        
        this.init();
    }

    init() {
        this.initCharts();
        this.initEventListeners();
        this.updateTime();
        this.startMonitoring();
        this.generateLog('System initialized', 'success');
    }

    initCharts() {
        // Bandwidth Chart
        const bandwidthCtx = document.getElementById('bandwidthChart').getContext('2d');
        this.charts.bandwidth = new Chart(bandwidthCtx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(),
                datasets: [
                    {
                        label: 'Upload',
                        data: [],
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Download',
                        data: [],
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#adb5bd'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#adb5bd',
                            callback: function(value) {
                                return value + ' Mbps';
                            }
                        }
                    }
                }
            }
        });

        // Protocol Chart
        const protocolCtx = document.getElementById('protocolChart').getContext('2d');
        this.charts.protocol = new Chart(protocolCtx, {
            type: 'doughnut',
            data: {
                labels: ['HTTP/HTTPS', 'DNS', 'TCP/UDP', 'Other'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [
                        '#4361ee',
                        '#4cc9f0',
                        '#7209b7',
                        '#6c757d'
                    ],
                    borderWidth: 2,
                    borderColor: '#1a202e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#adb5bd',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    initEventListeners() {
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.updateData();
            this.generateLog('Manual refresh triggered', 'info');
        });

        // Settings
        document.getElementById('update-interval').addEventListener('change', (e) => {
            this.updateInterval = parseInt(e.target.value);
            this.restartMonitoring();
            this.generateLog(`Update interval changed to ${e.target.value}ms`, 'info');
        });

        document.getElementById('data-limit').addEventListener('input', (e) => {
            this.dataPoints = parseInt(e.target.value);
            document.getElementById('data-limit-value').textContent = e.target.value;
            this.generateLog(`Data points limit changed to ${e.target.value}`, 'info');
        });

        document.getElementById('auto-refresh').addEventListener('change', (e) => {
            this.autoRefresh = e.target.checked;
            this.generateLog(`Auto refresh ${this.autoRefresh ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.generateLog('Settings saved successfully', 'success');
            this.showNotification('Settings saved!');
        });

        // Export data
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        // Clear logs
        document.getElementById('clear-logs').addEventListener('click', () => {
            document.getElementById('logs-container').innerHTML = '';
            this.generateLog('Logs cleared', 'warning');
        });

        // Help button
        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });
    }

    generateTimeLabels() {
        const labels = [];
        const now = new Date();
        
        for (let i = this.dataPoints - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * this.updateInterval));
            labels.push(time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}));
        }
        
        return labels;
    }

    generateRandomData(min, max) {
        return Math.random() * (max - min) + min;
    }

    updateData() {
        // Generate new data points
        const uploadSpeed = this.generateRandomData(5, 50);
        const downloadSpeed = this.generateRandomData(20, 100);
        const latency = Math.floor(this.generateRandomData(10, 100));
        const connections = Math.floor(this.generateRandomData(15, 45));

        // Update display
        document.getElementById('upload-speed').textContent = uploadSpeed.toFixed(2);
        document.getElementById('download-speed').textContent = downloadSpeed.toFixed(2);
        document.getElementById('latency').textContent = latency;
        document.getElementById('connections').textContent = connections;

        // Update latency gauge
        const latencyPercentage = Math.min(100, (latency / 100) * 100);
        document.getElementById('latency-gauge').style.width = `${latencyPercentage}%`;

        // Update connections list
        this.updateConnectionsList(connections);

        // Update charts data
        this.data.upload.push(uploadSpeed);
        this.data.download.push(downloadSpeed);
        this.data.latency.push(latency);
        this.data.connections.push(connections);

        // Keep only last N data points
        if (this.data.upload.length > this.dataPoints) {
            this.data.upload.shift();
            this.data.download.shift();
            this.data.latency.shift();
            this.data.connections.shift();
        }

        // Update charts
        this.updateCharts();

        // Update time
        this.updateTime();
    }

    updateCharts() {
        // Update bandwidth chart
        this.charts.bandwidth.data.datasets[0].data = this.data.upload;
        this.charts.bandwidth.data.datasets[1].data = this.data.download;
        this.charts.bandwidth.update();

        // Rotate protocol chart data for animation
        const protocolData = this.charts.protocol.data.datasets[0].data;
        const first = protocolData.shift();
        protocolData.push(first);
        this.charts.protocol.update();
    }

    updateConnectionsList(count) {
        const connectionsList = document.getElementById('connections-list');
        const protocols = ['HTTP', 'HTTPS', 'DNS', 'TCP', 'UDP', 'SSH', 'FTP'];
        
        connectionsList.innerHTML = '';
        
        for (let i = 0; i < Math.min(3, count); i++) {
            const protocol = protocols[Math.floor(Math.random() * protocols.length)];
            const ip = `192.168.1.${Math.floor(Math.random() * 255)}`;
            
            const connectionItem = document.createElement('div');
            connectionItem.className = 'connection-item';
            connectionItem.innerHTML = `
                <div class="connection-ip">${ip}</div>
                <div class="connection-protocol">${protocol}</div>
            `;
            
            connectionsList.appendChild(connectionItem);
        }
    }

    updateTime() {
        const now = new Date();
        document.getElementById('update-time').textContent = 
            now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
        
        // Update start time on first run
        if (!this.startTimeSet) {
            document.getElementById('start-time').textContent = 
                now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            this.startTimeSet = true;
        }
    }

    generateLog(message, type = 'info') {
        const logsContainer = document.getElementById('logs-container');
        const now = new Date();
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const typeClass = {
            'info': 'color: #4cc9f0',
            'success': 'color: #10b981',
            'warning': 'color: #f8961e',
            'error': 'color: #f94144'
        }[type] || 'color: #4cc9f0';
        
        logEntry.innerHTML = `
            <span class="log-time" style="${typeClass}">
                ${now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
            </span>
            <span class="log-message">${message}</span>
        `;
        
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    startMonitoring() {
        this.updateData();
        
        if (this.autoRefresh) {
            this.monitoringInterval = setInterval(() => {
                this.updateData();
            }, this.updateInterval);
        }
    }

    restartMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.startMonitoring();
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: {
                upload: this.data.upload,
                download: this.data.download,
                latency: this.data.latency,
                connections: this.data.connections
            },
            settings: {
                updateInterval: this.updateInterval,
                dataPoints: this.dataPoints,
                autoRefresh: this.autoRefresh
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `network-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.generateLog('Data exported successfully', 'success');
        this.showNotification('Data exported!');
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showHelp() {
        const helpMessage = `
Network Monitor Help:

• This dashboard displays simulated network data
• Upload/Download speeds are in Mbps
• Latency is in milliseconds (ms)
• Charts update every 2 seconds (configurable)
• Data is automatically saved in memory
• Click "Export Data" to download as JSON

Settings:
- Update Interval: How often to refresh data
- Data Points: Number of historical points to keep
- Auto Refresh: Toggle automatic updates

Note: This is a demonstration tool. Real network monitoring requires system-level access.
        `;

        alert(helpMessage);
    }
}

// Initialize the dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const monitor = new NetworkMonitor();
    
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});