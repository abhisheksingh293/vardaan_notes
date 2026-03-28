import fs from 'fs/promises';
import path from 'path';

const BASE_PATH = path.join(process.cwd(), 'public', 'storage', 'students');
const CONFIG_PATH = path.join(process.cwd(), 'public', 'storage', 'config', 'subjects.json');
const GLOBAL_TEST_PATH = path.join(process.cwd(), 'public', 'storage', 'global', 'Tests');

const ensureConfigExists = async () => {
    try {
        await fs.access(CONFIG_PATH);
    } catch {
        const dir = path.dirname(CONFIG_PATH);
        await fs.mkdir(dir, { recursive: true });
        const defaultSubjects = {
            CBSE: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Economics", "Accountancy", "Business Studies", "History", "Geography", "Political Science", "Computer Science"],
            ICSE: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "History & Civics", "Geography", "Economics", "Commercial Studies", "Computer Applications"]
        };
        await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultSubjects, null, 2), 'utf-8');
    }
};

export const getGlobalSubjects = async () => {
    await ensureConfigExists();
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
};

export const updateGlobalSubjects = async (board: string, subjects: string[]) => {
    await ensureConfigExists();
    const data = await getGlobalSubjects();
    data[board] = subjects;
    await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return data;
};

export const updateGlobalSubjectName = async (board: string, oldName: string, newName: string) => {
    await ensureConfigExists();
    const data = await getGlobalSubjects();
    if (data[board]) {
        data[board] = data[board].map((s: string) => (s === oldName ? newName : s));
        await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
    return data;
};

const ensureBasePath = async () => {
    try {
        await fs.access(BASE_PATH);
    } catch {
        await fs.mkdir(BASE_PATH, { recursive: true });
    }
}

export const initBasePath = () => ensureBasePath();

export const getStudentFolder = async (studentCode: string, studentName?: string) => {
    await initBasePath();
    try {
        const items = await fs.readdir(BASE_PATH, { withFileTypes: true });
        const folders = items.filter(item => 
            item.isDirectory() && (
                item.name === studentCode || 
                item.name.endsWith(`_${studentCode}`) ||
                item.name.startsWith(`${studentCode}_`)
            )
        );

        const standardName = studentName ? `${studentName.trim().replace(/[^a-zA-Z0-9]/g, '')}_${studentCode}` : null;
        
        // 1. If standard match exists, use it
        const standardFolder = folders.find(f => standardName && f.name === standardName);
        if (standardFolder) return path.join(BASE_PATH, standardFolder.name);

        // 2. Discover best matched existing folder to migrate/use
        // First try named ones, then the bare one
        const namedFolder = folders.find(f => f.name !== studentCode);
        const bareFolder = folders.find(f => f.name === studentCode);
        const bestLegacyFolder = namedFolder || bareFolder;

        if (bestLegacyFolder) {
            const oldPath = path.join(BASE_PATH, bestLegacyFolder.name);
            
            // If we have a name, migrate the best legacy folder to standard
            if (standardName) {
                const newPath = path.join(BASE_PATH, standardName);
                try {
                    // Safety check: avoid renaming if destination somehow appeared in between
                    if (bestLegacyFolder.name !== standardName) {
                        await fs.rename(oldPath, newPath);
                        console.log(`[fileService] MIGRATED: Renamed ${bestLegacyFolder.name} to ${standardName}`);
                        return newPath;
                    }
                } catch (e: any) {
                    console.error(`[fileService] Migration failed for ${studentCode}: ${e.message}`);
                    return oldPath;
                }
            }
            return oldPath;
        }

    } catch (e: any) {
        console.error(`[fileService] Error reading BASE_PATH for ${studentCode}: ${e.message}`);
    }
    
    // Fallback: Create path based on best information available
    const defaultName = studentName ? `${studentName.trim().replace(/[^a-zA-Z0-9]/g, '')}_${studentCode}` : studentCode;
    return path.join(BASE_PATH, String(defaultName));
};

export const getFolderName = async (studentCode: string, studentName?: string) => {
    const fullPath = await getStudentFolder(studentCode, studentName);
    return path.basename(fullPath);
};

export const getSubjects = async (studentCode: string, studentName?: string) => {
    try {
        const folderPath = await getStudentFolder(studentCode, studentName);
        const studentPath = path.join(folderPath, 'subjects');
        const items = await fs.readdir(studentPath, { withFileTypes: true });
        return items.filter(item => item.isDirectory()).map(item => item.name);
    } catch (error: any) {
        if(error.code === 'ENOENT') return [];
        throw error;
    }
};

export const getChapters = async (studentCode: string, subject: string, studentName?: string) => {
    try {
        const folderPath = await getStudentFolder(studentCode, studentName);
        const subjectPath = path.join(folderPath, 'subjects', subject);
        const items = await fs.readdir(subjectPath, { withFileTypes: true });
        return items.filter(item => item.isDirectory()).map(item => item.name);
    } catch (error: any) {
        if(error.code === 'ENOENT') return [];
        throw error;
    }
};

export const getFiles = async (studentCode: string, subject: string, chapter: string, studentName?: string) => {
    try {
        const folderPath = await getStudentFolder(studentCode, studentName);
        const chapterPath = path.join(folderPath, 'subjects', subject, chapter);
        const items = await fs.readdir(chapterPath, { withFileTypes: true });
        return items.filter(item => item.isFile() && item.name.endsWith('.html')).map(item => item.name);
    } catch (error: any) {
        if(error.code === 'ENOENT') return [];
        throw error;
    }
};

export const getMaterialCount = async (studentCode: string, studentName?: string) => {
    try {
        const folderPath = await getStudentFolder(studentCode, studentName);
        const subjectsPath = path.join(folderPath, 'subjects');
        let count = 0;
        
        const subjects = await fs.readdir(subjectsPath, { withFileTypes: true }).catch(() => []);
        for (const sub of subjects) {
            if (sub.isDirectory()) {
                const chaptersPath = path.join(subjectsPath, sub.name);
                const chapters = await fs.readdir(chaptersPath, { withFileTypes: true }).catch(() => []);
                for (const chap of chapters) {
                    if (chap.isDirectory()) {
                        const filesPath = path.join(chaptersPath, chap.name);
                        const files = await fs.readdir(filesPath, { withFileTypes: true }).catch(() => []);
                        count += files.filter(f => f.isFile() && f.name.endsWith('.html')).length;
                    }
                }
            }
        }
        return count;
    } catch (e) {
        return 0;
    }
};

export const getTestCounts = async (studentCode: string, studentName?: string) => {
    try {
        const folderPath = await getStudentFolder(studentCode, studentName);
        const testsPath = path.join(folderPath, 'Test');
        const items = await fs.readdir(testsPath, { withFileTypes: true }).catch(() => []);
        
        const minorTests = items.filter(i => i.isDirectory() && i.name.startsWith('Minor Test')).length;
        const majorTests = items.filter(i => i.isDirectory() && i.name.startsWith('Major Test')).length;
        
        return { minor: minorTests, major: majorTests };
    } catch (e) {
        return { minor: 0, major: 0 };
    }
};

export const createStudentFolder = async (studentCode: string, studentName?: string) => {
    await initBasePath();
    // Use getStudentFolder to resolve/migrate if possible
    const studentPath = await getStudentFolder(studentCode, studentName);
    const subjectsPath = path.join(studentPath, 'subjects');
    const testsPath = path.join(studentPath, 'Test');
    
    await fs.mkdir(studentPath, { recursive: true });
    await fs.mkdir(subjectsPath, { recursive: true });
    await fs.mkdir(testsPath, { recursive: true });
    return { success: true, path: studentPath };
};

export const createFile = async (studentCode: string, subject: string, chapter: string, filename: string, content?: string, studentName?: string) => {
    await initBasePath();
    const folderPath = await getStudentFolder(studentCode, studentName);
    
    const chapterPath = path.join(folderPath, 'subjects', subject, chapter);
    await fs.mkdir(chapterPath, { recursive: true });
    
    if(!filename.endsWith('.html')) filename += '.html';
    
    const filePath = path.join(chapterPath, filename);
    await fs.writeFile(filePath, content || `<!DOCTYPE html>\n<html>\n<head><title>${filename}</title></head>\n<body style="font-family: sans-serif; padding: 20px;">\n  <h1>${filename}</h1>\n  <p>This is dynamic content.</p>\n</body>\n</html>`, 'utf-8');
    return { success: true, path: filePath };
};

export const getFullFolderTree = async (studentCode: string, studentName?: string) => {
    const tree: any = {};
    const folderName = await getFolderName(studentCode, studentName);

    const subjects = await getSubjects(studentCode, studentName);
    for (const subject of subjects) {
        tree[subject] = {};
        const chapters = await getChapters(studentCode, subject, studentName);
        for (const chapter of chapters) {
            const files = await getFiles(studentCode, subject, chapter, studentName);
            tree[subject][chapter] = files;
        }
    }

    const testTree = await getTestTree(studentCode, studentName);
    return { tree, testTree, folderName };
}

export const getTests = async (studentCode: string, studentName?: string) => {
    try {
        const folderPath = await getStudentFolder(studentCode, studentName);
        const testPath = path.join(folderPath, 'Test');
        await fs.mkdir(testPath, { recursive: true });
        const items = await fs.readdir(testPath, { withFileTypes: true });
        return items.filter(item => item.isDirectory()).map(item => item.name);
    } catch (error: any) {
        if(error.code === 'ENOENT') return [];
        throw error;
    }
}

export const getTestFiles = async (studentCode: string, testFolder: string, studentName?: string) => {
    try {
        const folderPath = await getStudentFolder(studentCode, studentName);
        const testFilePath = path.join(folderPath, 'Test', testFolder);
        const items = await fs.readdir(testFilePath, { withFileTypes: true });
        return items.filter(item => item.isFile() && item.name.endsWith('.html')).map(item => item.name);
    } catch (error: any) {
        if(error.code === 'ENOENT') return [];
        throw error;
    }
}

export const getTestTree = async (studentCode: string, studentName?: string) => {
    const tree: any = {};
    const tests = await getTests(studentCode, studentName);
    for (const test of tests) {
        tree[test] = await getTestFiles(studentCode, test, studentName);
    }
    return tree;
}

export const getGlobalTests = async () => {
    try {
        await initBasePath();
        const items = await fs.readdir(BASE_PATH, { withFileTypes: true });
        const testsSet = new Set<string>();

        // Scan all student folders for Test directories natively
        for (const item of items) {
            if (!item.isDirectory() || item.name === 'global') continue;
            
            try {
                const testPath = path.join(BASE_PATH, item.name, 'Test');
                const testItems = await fs.readdir(testPath, { withFileTypes: true });
                for (const testDir of testItems) {
                    if (testDir.isDirectory()) testsSet.add(testDir.name);
                }
            } catch (e) {
                // Ignore if student has no Test folder
            }
        }
        return Array.from(testsSet).sort();
    } catch (error: any) {
        return [];
    }
}

export const getGlobalTestFiles = async (testFolder: string) => {
    try {
        await initBasePath();
        const items = await fs.readdir(BASE_PATH, { withFileTypes: true });

        // Find the first student that has this test folder and extrapolate files
        for (const item of items) {
            if (!item.isDirectory() || item.name === 'global') continue;
            
            try {
                const testFilePath = path.join(BASE_PATH, item.name, 'Test', testFolder);
                const fileItems = await fs.readdir(testFilePath, { withFileTypes: true });
                const files = fileItems.filter(f => f.isFile() && f.name.endsWith('.html')).map(f => f.name);
                if (files.length > 0) return files.sort();
            } catch (e) {
                // Continue to next student repository
            }
        }
        return [];
    } catch (error: any) {
        return [];
    }
}

export const getGlobalTestTree = async () => {
    const tree: any = {};
    const tests = await getGlobalTests();
    for (const test of tests) {
        tree[test] = await getGlobalTestFiles(test);
    }
    return tree;
}

export const deployAutoTest = async (type: 'Minor' | 'Major', studentCodes: string[]) => {
    // 1. Determine next index intrinsically by scanning existing test deployments
    const existingTests = await getGlobalTests();
    const matchingFolders = existingTests.filter(name => name.startsWith(`${type} Test`));

    let maxIndex = 0;
    matchingFolders.forEach(name => {
        const parts = name.split(' ');
        const index = parseInt(parts[parts.length - 1]);
        if (!isNaN(index) && index > maxIndex) maxIndex = index;
    });

    const nextIndex = maxIndex + 1;
    const testName = `${type} Test ${nextIndex}`;
    
    // 2. Provisioning Template Variables
    const testFileName = `${type.toLowerCase()}test${nextIndex}.html`;
    const solutionFileName = type === 'Minor' ? `minorsolution.html` : `majortestsolution.html`;
    const boilerplate = (title: string) => `<!DOCTYPE html>\n<html>\n<head><title>${title}</title></head>\n<body style="font-family: sans-serif; padding: 40px; background: #fafafa;">\n  <h1 style="color: #333;">${title}</h1>\n  <p>Vardaan Comet Assessment System</p>\n</body>\n</html>`;

    // 3. Massive Provisioning: Loop through students
    const results = [];
    for (const code of studentCodes) {
        try {
            const studentPath = await getStudentFolder(code);
            const studentTestPath = path.join(studentPath, 'Test', testName);
            await fs.mkdir(studentTestPath, { recursive: true });
            
            // Build dynamically without relying on absolute global template copying
            await fs.writeFile(path.join(studentTestPath, testFileName), boilerplate(`${type} Test ${nextIndex}`), 'utf-8');
            await fs.writeFile(path.join(studentTestPath, solutionFileName), boilerplate(`${type} Test ${nextIndex} Solution`), 'utf-8');
            
            results.push({ code, success: true });
        } catch (err: any) {
            results.push({ code, success: false, error: err.message });
        }
    }

    return { success: true, testName, detailed: results };
}

export const permanentlyDeleteTest = async (testName: string, studentCodes: string[]) => {
    // 1. Massive Cleanup: Loop through students natively
    const results = [];
    for (const code of studentCodes) {
        try {
            const studentPath = await getStudentFolder(code);
            const studentTestPath = path.join(studentPath, 'Test', testName);
            await fs.rm(studentTestPath, { recursive: true, force: true });
            results.push({ code, success: true });
        } catch (err: any) {
            results.push({ code, success: false, error: err.message });
        }
    }
    
    // 2. Soft fallback: Destroy global registry footprint if it existed previously
    const globalPath = path.join(GLOBAL_TEST_PATH, testName);
    await fs.rm(globalPath, { recursive: true, force: true }).catch(() => {});

    return { success: true, detailed: results };
}

export const renameSubject = async (studentCode: string, oldName: string, newName: string) => {
    await initBasePath();
    const folderPath = await getStudentFolder(studentCode);
    const subjectsPath = path.join(folderPath, 'subjects');
    
    const oldPath = path.join(subjectsPath, oldName);
    const newPath = path.join(subjectsPath, newName);

    // Check if original exists
    try {
        await fs.access(oldPath);
    } catch {
        throw new Error(`Subject folder "${oldName}" not found.`);
    }

    // Check if destination already exists
    try {
        await fs.access(newPath);
        throw new Error(`Subject folder "${newName}" already exists.`);
    } catch (e: any) {
        if (e.message.includes('already exists')) throw e;
        // Proceed if newPath doesn't exist (ENOENT expected)
    }

    await fs.rename(oldPath, newPath);
    return { success: true };
};

export const renameSubjectGlobally = async (studentCodes: string[], oldName: string, newName: string) => {
    await initBasePath();
    const results = [];
    for (const studentCode of studentCodes) {
        try {
            const folderPath = await getStudentFolder(studentCode);
            const subjectsPath = path.join(folderPath, 'subjects');
            const oldPath = path.join(subjectsPath, oldName);
            const newPath = path.join(subjectsPath, newName);

            // Access check
            try {
                await fs.access(oldPath);
                // If it exists, rename it
                await fs.rename(oldPath, newPath);
                results.push({ studentCode, success: true });
            } catch {
                // Folder doesn't exist for this student, ignore
                results.push({ studentCode, success: false, reason: 'Folder not found' });
            }
        } catch (err: any) {
            results.push({ studentCode, success: false, error: err.message });
        }
    }
    return results;
};

export const deleteFile = async (studentCode: string, subject: string, chapter: string, filename: string, studentName?: string) => {
    await initBasePath();
    const folderPath = await getStudentFolder(studentCode, studentName);
    const filePath = path.join(folderPath, 'subjects', subject, chapter, filename);

    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        return { success: true };
    } catch (error: any) {
        throw new Error(`Failed to delete file: ${error.message}`);
    }
};

export const deleteStudentSubject = async (studentCode: string, subject: string, studentName?: string) => {
    await initBasePath();
    const folderPath = await getStudentFolder(studentCode, studentName);
    const subjectPath = path.join(folderPath, 'subjects', subject);

    try {
        await fs.access(subjectPath);
        await fs.rm(subjectPath, { recursive: true, force: true });
        return { success: true };
    } catch (error: any) {
        throw new Error(`Failed to delete subject: ${error.message}`);
    }
};

export const deleteStudentTest = async (studentCode: string, testName: string, studentName?: string) => {
    await initBasePath();
    const folderPath = await getStudentFolder(studentCode, studentName);
    const testPath = path.join(folderPath, 'Test', testName);

    try {
        await fs.access(testPath);
        await fs.rm(testPath, { recursive: true, force: true });
        return { success: true };
    } catch (error: any) {
        throw new Error(`Failed to delete test: ${error.message}`);
    }
};

export const deleteStudentTestFile = async (studentCode: string, testName: string, filename: string, studentName?: string) => {
    await initBasePath();
    const folderPath = await getStudentFolder(studentCode, studentName);
    const filePath = path.join(folderPath, 'Test', testName, filename);

    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        return { success: true };
    } catch (error: any) {
        throw new Error(`Failed to delete test file: ${error.message}`);
    }
};
