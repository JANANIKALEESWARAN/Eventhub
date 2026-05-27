const mongoose = require('mongoose');
const Story = require('./models/Story');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/insta_App').then(async () => {
  const stories = await Story.find({ 
    'comments.0': { $exists: true } 
  }).populate('comments.user', 'name');
  
  console.log('--- Story Comments ---');
  if (stories.length === 0) {
    console.log('No comments found in the database.');
  }
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
