const mongoose = require('mongoose');

const syncCategoryEnum = async () => {
  try {
    const Category = mongoose.model('Category');
    const User = mongoose.model('User');
    
    const categories = await Category.find();
    const names = categories.map(c => c.name);
    
    // Default fallback categories
    const defaults = ["Hostel", "Academic", "Infrastructure", "IT Services", "Security", "Other"];
    
    // Combine and deduplicate
    const combined = Array.from(new Set([...defaults, ...names]));
    
    // Sync User schema path enum values
    if (User && User.schema && User.schema.path('category')) {
      User.schema.path('category').enumValues = combined;
    }
  } catch (err) {
    console.error('Failed to sync category enum:', err);
  }
};

module.exports = { syncCategoryEnum };
