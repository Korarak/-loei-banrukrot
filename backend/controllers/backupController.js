const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Get list of all database backups
 * @route   GET /api/settings/backups
 * @access  Private (Admin/Staff)
 */
exports.listBackups = async (req, res) => {
    try {
        // The path on the production server where backups are stored
        // In dev, we can check a local backups folder
        const backupDir = process.env.NODE_ENV === 'production' 
            ? path.join(process.env.HOME || '/home/adm1n_ltc', 'loei-banrakrod', 'backups')
            : path.join(__dirname, '../../backups');

        if (!fs.existsSync(backupDir)) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'Backup directory does not exist yet'
            });
        }

        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.tar.gz'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    createdAt: stats.mtime,
                    path: filePath
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json({
            success: true,
            count: files.length,
            data: files
        });
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list backups'
        });
    }
};

/**
 * @desc    Trigger a fresh database backup
 * @route   POST /api/settings/backups/run
 * @access  Private (Admin/Staff)
 */
exports.triggerBackup = async (req, res) => {
    try {
        const scriptPath = process.env.NODE_ENV === 'production'
            ? path.join(process.env.HOME || '/home/adm1n_ltc', 'loei-banrakrod', 'scripts', 'backup-db.sh')
            : path.join(__dirname, '../../scripts/database/backup-db.sh');

        if (!fs.existsSync(scriptPath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup script not found on server'
            });
        }

        // Execute the shell script
        exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                return res.status(500).json({
                    success: false,
                    message: 'Backup execution failed',
                    error: stderr
                });
            }
            
            console.log(`Backup stdout: ${stdout}`);
            res.status(200).json({
                success: true,
                message: 'Backup started successfully',
                output: stdout
            });
        });
    } catch (error) {
        console.error('Error triggering backup:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during backup trigger'
        });
    }
};
