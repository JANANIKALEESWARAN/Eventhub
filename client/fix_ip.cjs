const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');
const newIP = '10.1.60.12';

function fixIP(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixIP(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Skip api.js as we already updated it manually
      if (file === 'api.js') return;

      // Replace standard dynamic SERVER_IP
      if (content.includes("const SERVER_IP = window.location.hostname === 'localhost'")) {
        content = content.replace(/const SERVER_IP = window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1' \? 'localhost' : window\.location\.hostname;/g, `const SERVER_IP = '${newIP}';`);
        modified = true;
      }

      // Replace PostCard.jsx specific
      if (content.includes("const SERVER_IP = IS_LOCAL_PC ? 'localhost' : window.location.hostname;")) {
        content = content.replace(/const IS_LOCAL_PC = window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1';\s*const SERVER_IP = IS_LOCAL_PC \? 'localhost' : window\.location\.hostname;/g, `const SERVER_IP = '${newIP}';`);
        modified = true;
      }
      
      // Replace Profile.jsx specific
      if (content.includes("const SERVER_IP = '192.168.43.22';")) {
        content = content.replace(/const SERVER_IP = '192\.168\.43\.22';/g, `const SERVER_IP = '${newIP}';`);
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

fixIP(directoryPath);
console.log('IP fix complete!');
