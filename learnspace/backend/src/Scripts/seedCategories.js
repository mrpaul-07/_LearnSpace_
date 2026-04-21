require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');

const categories = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Courses about frontend, backend, and full stack development',
    icon: 'code',
    is_active: true,
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    description: 'Courses about data analysis, machine learning, and AI',
    icon: 'database',
    is_active: true,
  },
  {
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'Courses about interface and user experience design',
    icon: 'palette',
    is_active: true,
  },
  {
    name: 'Mobile App Development',
    slug: 'mobile-app-development',
    description: 'Courses about Android, iOS, and cross-platform apps',
    icon: 'smartphone',
    is_active: true,
  },
  {
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Courses about SEO, ads, and growth marketing',
    icon: 'megaphone',
    is_active: true,
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Courses about entrepreneurship, management, and business strategy',
    icon: 'briefcase',
    is_active: true,
  },
];

const seedCategories = async () => {
  try {
    await connectDB();

    for (const item of categories) {
      await Category.updateOne(
        { slug: item.slug },
        { $set: item },
        { upsert: true }
      );
    }

    console.log('Categories seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed categories:', error);
    process.exit(1);
  }
};

seedCategories();