const fs = require('fs');

// ⚠️  PASTE YOUR RAILWAY URL HERE before running this script
const RAILWAY_URL = 'https://YOUR-RAILWAY-URL.up.railway.app';

const files = [
  'd:/insta_App/client/src/components/Navbar.jsx',
  'd:/insta_App/client/src/components/PostCard.jsx',
  'd:/insta_App/client/src/components/Sidebar.jsx',
  'd:/insta_App/client/src/pages/CoordinatorDashboard.jsx',
  'd:/insta_App/client/src/pages/EventDetail.jsx',
  'd:/insta_App/client/src/pages/Events.jsx',
  'd:/insta_App/client/src/pages/Home.jsx',
  'd:/insta_App/client/src/pages/Messages.jsx',
  'd:/insta_App/client/src/pages/Networking.jsx',
  'd:/insta_App/client/src/pages/Profile.jsx',
  'd:/insta_App/client/src/pages/Saved.jsx',
];

// Replace the dynamic SERVER_IP resolution with a fixed production URL
const OLD_PATTERN = /const SERVER_IP = \(window\.location\.hostname === 'localhost' \|\| window\.location\.protocol\.includes\('capacitor'\)\) \? '10\.174\.30\.15' : window\.location\.hostname;/g;
const NEW_VALUE = `const SERVER_IP = '${RAILWAY_URL.replace('https://', '').replace('http://', '')}'; // production cloud`;

// Also replace url builder to use https not http
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace SERVER_IP dynamic detection with fixed cloud host
    content = content.replace(OLD_PATTERN, NEW_VALUE);
    
    // Replace http:// with https:// where cloud host is used
    // This replaces patterns like `http://${SERVER_IP}:5000/...` -> `https://${SERVER_IP}/...`
    content = content.replace(
      new RegExp('`http://\\$\\{SERVER_IP(_\\w+)?\\}:5000/', 'g'),
      '`https://${SERVER_IP}/'
    );

    fs.writeFileSync(file, content);
    console.log('✅ Updated: ' + file);
  } else {
    console.log('⚠️  Not found: ' + file);
  }
});

console.log('\n✅ Done! Now run: npm run build → npx cap sync android → gradlew assembleDebug');
