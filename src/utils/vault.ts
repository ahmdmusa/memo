import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import JSZip from 'jszip';
import CryptoJS from 'crypto-js';

const DB_NAME = 'memo.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

/**
 * Creates a `.garden` encrypted ZIP backup
 * Returns the URI to the saved file
 */
export async function exportVault(password: string): Promise<string> {
    try {
        const zip = new JSZip();

        // 1. Add Database
        const dbExists = await FileSystem.getInfoAsync(DB_PATH);
        if (dbExists.exists) {
            const dbContent = await FileSystem.readAsStringAsync(DB_PATH, { encoding: FileSystem.EncodingType.Base64 });
            zip.file('database/memo.db', dbContent, { base64: true });
        }

        // 2. Add Media files
        if (FileSystem.documentDirectory) {
            const allFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
            const mediaExtensions = ['.jpg', '.jpeg', '.png', '.m4a', '.mp4', '.mov'];
            for (const file of allFiles) {
                if (mediaExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
                    const filePath = `${FileSystem.documentDirectory}${file}`;
                    const fileInfo = await FileSystem.getInfoAsync(filePath);
                    if (fileInfo.exists && !fileInfo.isDirectory) {
                        const content = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });
                        zip.file(`media/${file}`, content, { base64: true });
                    }
                }
            }
        }

        // 3. Generate ZIP as Base64
        const zipBase64 = await zip.generateAsync({ type: 'base64' });

        // 4. Encrypt with AES
        const encrypted = CryptoJS.AES.encrypt(zipBase64, password).toString();

        // 5. Save to temporary .garden file
        const timestamp = new Date().getTime();
        const exportUri = `${FileSystem.cacheDirectory}PrivateGarden_Backup_${timestamp}.garden`;
        await FileSystem.writeAsStringAsync(exportUri, encrypted, { encoding: FileSystem.EncodingType.UTF8 });

        return exportUri;
    } catch (e: any) {
        throw new Error(`Export failed: ${e.message}`);
    }
}

/**
 * Restores a `.garden` backup
 */
export async function importVault(uri: string, password: string): Promise<boolean> {
    try {
        const encrypted = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });

        // 1. Decrypt with AES
        const decryptedBytes = CryptoJS.AES.decrypt(encrypted, password);
        const zipBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!zipBase64) {
            throw new Error("Invalid password or corrupt file.");
        }

        // 2. Unzip contents
        const zip = await JSZip.loadAsync(zipBase64, { base64: true });

        // 3. Restore Database
        const dbFile = zip.file('database/memo.db');
        if (dbFile) {
            const dbBase64 = await dbFile.async('base64');
            // Ensure SQLite dir exists
            const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
            const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
            }
            await FileSystem.writeAsStringAsync(DB_PATH, dbBase64, { encoding: FileSystem.EncodingType.Base64 });
        }

        // 4. Restore Media
        const files = Object.keys(zip.files);
        for (const filename of files) {
            if (filename.startsWith('media/') && !zip.files[filename].dir) {
                const actualName = filename.replace('media/', '');
                const destPath = `${FileSystem.documentDirectory}${actualName}`;
                const contentBase64 = await zip.files[filename].async('base64');
                await FileSystem.writeAsStringAsync(destPath, contentBase64, { encoding: FileSystem.EncodingType.Base64 });
            }
        }

        return true;
    } catch (e: any) {
        throw new Error(`Restore failed: ${e.message}`);
    }
}
