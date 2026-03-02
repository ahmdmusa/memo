const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, fileList);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = findFiles(srcDir);

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Check if the file imports Colors from theme
    if (content.includes('import { Colors') || content.includes(', Colors') || content.includes('Colors,')) {
        if (content.includes("from '../theme'") || content.includes("from '@/theme'") || content.includes("from './theme'")) {

            console.log(`Refactoring ${file}...`);

            // 1. Remove Colors from the import statement. 
            // This regex handles various cases: "Colors,", ", Colors", "Colors"
            content = content.replace(/\bColors\b\s*,?/g, '');
            // Clean up empty braces if any like "import { } from '../theme'"
            content = content.replace(/import\s*{\s*,?\s*}\s*from\s*['"][^'"]+['"];?/g, '');
            // Clean up trailing commas inside braces like "import { Spacing, } from"
            content = content.replace(/,\s*}/g, ' }');

            // 2. Add useSettings import
            // Calculate relative path to src/context/SettingsContext
            let relPath = path.relative(path.dirname(file), path.join(srcDir, 'context', 'SettingsContext'));
            relPath = relPath.replace(/\\/g, '/');
            if (!relPath.startsWith('.')) relPath = './' + relPath;

            const importStatement = `import { useSettings } from '${relPath}';\n`;

            // Insert after the last import
            const lastImportIndex = content.lastIndexOf('import ');
            const endOfLastImport = content.indexOf('\n', lastImportIndex);
            if (lastImportIndex !== -1 && endOfLastImport !== -1) {
                content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
            } else {
                content = importStatement + content;
            }

            // 3. Inject const { colors: Colors } = useSettings(); at the top of the main component/function.
            // This is tricky. We look for "export default function", "export function", or "const [CompName] = "
            const componentRegex = /(?:export\s+default\s+function\s+\w+\s*\([^)]*\)\s*{|export\s+function\s+\w+\s*\([^)]*\)\s*{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{)/;

            const match = content.match(componentRegex);
            if (match) {
                const insertPos = match.index + match[0].length;
                const hookInjection = `\n    const { colors: Colors } = useSettings();\n`;
                content = content.slice(0, insertPos) + hookInjection + content.slice(insertPos);

                fs.writeFileSync(file, content);
                console.log(`  -> SUCCESS`);
            } else {
                console.log(`  -> WARNING: Could not find main component to inject hook in ${file}`);
            }
        }
    }
}
console.log('Done refactoring.');
