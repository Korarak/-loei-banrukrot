const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

function getBackupDir() {
    return process.env.NODE_ENV === 'production'
        ? path.join(process.env.HOME || '/home/adm1n_ltc', 'loei-banrakrod', 'backups')
        : path.join(__dirname, '../../backups');
}

/**
 * @desc    Get list of all database backups
 * @route   GET /api/settings/backups
 * @access  Private (Admin/Staff)
 */
exports.listBackups = async (req, res) => {
    try {
        const backupDir = getBackupDir();

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
                const stats = fs.statSync(path.join(backupDir, file));
                return {
                    filename: file,
                    size: stats.size,
                    createdAt: stats.mtime,
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

/**
 * @desc    Download a single database backup file (mongodump archive, gzip-compressed)
 * @route   GET /api/settings/backups/:filename/download
 * @access  Private (Admin/Staff)
 */
exports.downloadBackup = async (req, res) => {
    try {
        const backupDir = getBackupDir();
        // path.basename strips any directory components so the request can't escape backupDir
        const filename = path.basename(req.params.filename);

        if (!filename.endsWith('.tar.gz')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid backup filename'
            });
        }

        const filePath = path.join(backupDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup file not found'
            });
        }

        res.download(filePath, filename);
    } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download backup'
        });
    }
};

/**
 * @desc    Download the entire uploads directory as a zip archive
 * @route   GET /api/settings/uploads/download
 * @access  Private (Admin/Staff)
 */
exports.downloadUploads = async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../public/uploads');

        if (!fs.existsSync(uploadsDir)) {
            return res.status(404).json({
                success: false,
                message: 'Uploads directory does not exist'
            });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="uploads_${timestamp}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('Error zipping uploads:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Failed to create uploads archive' });
            } else {
                res.destroy(err);
            }
        });

        archive.pipe(res);
        archive.directory(uploadsDir, false);
        archive.finalize();
    } catch (error) {
        console.error('Error downloading uploads:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download uploads'
        });
    }
};
