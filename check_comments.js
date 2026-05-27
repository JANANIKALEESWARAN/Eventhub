const mongoose = require('mongoose');
const Story = require('./server/models/Story');
const User = require('./server/models/User'); // Ensure User model is loaded for population

mongoose.connect('mongodb://localhost:27017/insta_App').then(async () => {
  const stories = await Story.find({ 
    'comments.0': { $exists: true } 
  }).populate('comments.user', 'name');
  
  console.log('--- Story Comments ---');
  stories.forEach(s => {
    console.log(`Story ID: ${s._id}`);
    s.comments.forEach(c => {
      console.log(`- ${c.user?.name || 'Unknown'}: ${c.text}`);
    });
  });
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
