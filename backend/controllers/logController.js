const Log = require('../models/Log');

// Get all logs with optional filtering and sorting
exports.getLogs = async (req, res) => {
    try {
        const { level, search, limit = 50, page = 1 } = req.query;

        const query = {};
        if (level) {
            query.level = level;
        }

        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { user: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Log.countDocuments(query);

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            data: logs
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching logs',
            error: error.message
        });
    }
};

exports.exportLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 });

        // Define CSV headers
        const headers = ['Timestamp', 'Level', 'User', 'Action', 'Message'];

        // Convert logs to CSV rows
        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.level,
            log.user || 'System',
            log.action || 'N/A',
            `"${log.message.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=system_logs.csv');

        res.status(200).send(csvContent);
    } catch (error) {
        console.error('Export logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting logs',
            error: error.message
        });
    }
};
