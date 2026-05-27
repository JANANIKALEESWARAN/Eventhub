const fs = require('fs');

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
  'd:/insta_App/client/src/pages/Saved.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /const SERVER_IP = '10\.174\.30\.15';/g,
      `const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;`
    );
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
