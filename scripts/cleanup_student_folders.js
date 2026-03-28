const fs = require('fs');
const path = require('path');

const STUDENTS_DIR = path.join(process.cwd(), 'client', 'public', 'storage', 'students');

if (!fs.existsSync(STUDENTS_DIR)) {
    console.error('Students directory does not exist:', STUDENTS_DIR);
    process.exit(1);
}

const mergeFolders = (src, dest) => {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.statSync(srcPath).isDirectory()) {
            mergeFolders(srcPath, destPath);
        } else {
            // If file already exists, keep the newer one or just overwrite
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

const cleanup = () => {
    const items = fs.readdirSync(STUDENTS_DIR);
    const folderGroups = {};

    for (const item of items) {
        const itemPath = path.join(STUDENTS_DIR, item);
        if (fs.statSync(itemPath).isDirectory()) {
            const code = item.split('_').pop();
            if (!folderGroups[code]) folderGroups[code] = [];
            folderGroups[code].push(item);
        }
    }

    for (const [code, folders] of Object.entries(folderGroups)) {
        if (folders.length > 1) {
            console.log(`Processing duplicate folders for code ${code}:`, folders);
            
            // Prioritize the longest name as the "standard" one (usually Name_Code)
            // or the one that contains an underscore.
            const sortedFolders = folders.sort((a, b) => {
                const aHasUnder = a.includes('_');
                const bHasUnder = b.includes('_');
                if (aHasUnder && !bHasUnder) return -1;
                if (!aHasUnder && bHasUnder) return 1;
                return b.length - a.length;
            });

            const standard = sortedFolders[0];
            const standardPath = path.join(STUDENTS_DIR, standard);

            for (let i = 1; i < sortedFolders.length; i++) {
                const legacy = sortedFolders[i];
                const legacyPath = path.join(STUDENTS_DIR, legacy);
                
                console.log(`Merging ${legacy} into ${standard}...`);
                try {
                    mergeFolders(legacyPath, standardPath);
                    console.log(`Successfully merged ${legacy}. Deleting legacy folder...`);
                    fs.rmSync(legacyPath, { recursive: true, force: true });
                } catch (err) {
                    console.error(`Failed to merge ${legacy}:`, err.message);
                }
            }
        }
    }
    console.log('Cleanup complete.');
};

cleanup();
