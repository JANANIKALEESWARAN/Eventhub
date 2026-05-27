const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Event = require('./models/Event');
    await Event.updateMany(
      { title: { $in: ['Mechanical internship', 'Eventmedia', 'AI Conclave'] } },
      { $set: { registrationLimit: 50 } }
    );
    console.log('Done updating DB');
    process.exit(0);
  })
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
