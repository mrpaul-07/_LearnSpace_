// ============================================================
// LearnSpace - i18n Setup (English + Bangla)
// ============================================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.browse': 'Browse Courses',
      'nav.dashboard': 'Dashboard',
      'nav.login': 'Log In',
      'nav.signup': 'Sign Up Free',
      'nav.logout': 'Log Out',
      'nav.my_courses': 'My Courses',
      'nav.certificates': 'Certificates',
      'nav.create_course': 'Create Course',

      // Home
      'home.hero_title': 'Learn anything, anytime',
      'home.hero_subtitle': 'Bangladesh\'s open marketplace for online courses. Learn from verified instructors and earn recognized certificates.',
      'home.cta_browse': 'Browse Courses',
      'home.cta_become_instructor': 'Become an Instructor',
      'home.featured': 'Featured Courses',
      'home.popular_categories': 'Popular Categories',
      'home.why_us': 'Why LearnSpace?',
      'home.recommended': 'Recommended for you',

      // Course
      'course.enroll_now': 'Enroll Now',
      'course.enroll_free': 'Enroll for Free',
      'course.go_to_course': 'Go to Course',
      'course.what_youll_learn': 'What you\'ll learn',
      'course.requirements': 'Requirements',
      'course.description': 'Description',
      'course.curriculum': 'Curriculum',
      'course.instructor': 'Instructor',
      'course.lessons': 'lessons',
      'course.students': 'students',
      'course.level': 'Level',
      'course.language': 'Language',
      'course.free': 'Free',
      'course.continue': 'Continue',
      'course.start': 'Start',
      'course.review': 'Review',

      // Auth
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirm_password': 'Confirm Password',
      'auth.name': 'Full Name',
      'auth.phone': 'Phone (optional)',
      'auth.role': 'I am a',
      'auth.student': 'Student',
      'auth.instructor': 'Instructor',
      'auth.login': 'Log in',
      'auth.register': 'Register',
      'auth.forgot_password': 'Forgot password?',
      'auth.no_account': 'Don\'t have an account?',
      'auth.have_account': 'Already have an account?',

      // Dashboard
      'dash.welcome': 'Welcome back',
      'dash.continue_learning': 'Continue Learning',
      'dash.enrolled_courses': 'Enrolled Courses',
      'dash.in_progress': 'In Progress',
      'dash.completed': 'Completed',
      'dash.certificates': 'Certificates',
      'dash.no_courses': 'No courses yet',
      'dash.browse_now': 'Browse Marketplace',
      'dash.complete': 'complete',

      // Payment
      'pay.checkout': 'Secure Checkout',
      'pay.summary': 'Order Summary',
      'pay.method': 'Select Payment Method',
      'pay.demo': 'Demo Pay',
      'pay.card': 'Card / Stripe',
      'pay.local': 'SSLCommerz',
      'pay.local_sub': 'bKash, Nagad, Card',
      'pay.total': 'Total',
      'pay.processing': 'Processing...',
      'pay.success': 'Payment Successful!',
      'pay.failed': 'Payment Failed',
      'pay.start': 'Start Learning',

      // Common
      'common.loading': 'Loading...',
      'common.search': 'Search...',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.submit': 'Submit',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.view': 'View',
      'common.back': 'Back',

      // Chatbot
      'bot.title': 'LearnSpace Assistant',
      'bot.placeholder': 'Ask me anything...',
      'bot.send': 'Send',
      'bot.greeting': 'Hi! How can I help you today?',
      'bot.open': 'Open assistant',
    }
  },
  bn: {
    translation: {
      // Navigation
      'nav.browse': 'কোর্স দেখুন',
      'nav.dashboard': 'ড্যাশবোর্ড',
      'nav.login': 'লগ ইন',
      'nav.signup': 'বিনামূল্যে সাইন আপ',
      'nav.logout': 'লগ আউট',
      'nav.my_courses': 'আমার কোর্স',
      'nav.certificates': 'সার্টিফিকেট',
      'nav.create_course': 'কোর্স তৈরি করুন',

      // Home
      'home.hero_title': 'যেকোনো সময়, যেকোনো কিছু শিখুন',
      'home.hero_subtitle': 'বাংলাদেশের উন্মুক্ত অনলাইন কোর্স মার্কেটপ্লেস। যাচাইকৃত শিক্ষকদের কাছ থেকে শিখুন, স্বীকৃত সার্টিফিকেট অর্জন করুন।',
      'home.cta_browse': 'কোর্স দেখুন',
      'home.cta_become_instructor': 'শিক্ষক হোন',
      'home.featured': 'ফিচার্ড কোর্স',
      'home.popular_categories': 'জনপ্রিয় বিষয়',
      'home.why_us': 'কেন LearnSpace?',
      'home.recommended': 'আপনার জন্য সুপারিশ',

      // Course
      'course.enroll_now': 'এখনই ভর্তি হন',
      'course.enroll_free': 'বিনামূল্যে ভর্তি হন',
      'course.go_to_course': 'কোর্সে যান',
      'course.what_youll_learn': 'আপনি যা শিখবেন',
      'course.requirements': 'প্রয়োজনীয়তা',
      'course.description': 'বিবরণ',
      'course.curriculum': 'পাঠক্রম',
      'course.instructor': 'শিক্ষক',
      'course.lessons': 'টি লেসন',
      'course.students': 'জন শিক্ষার্থী',
      'course.level': 'স্তর',
      'course.language': 'ভাষা',
      'course.free': 'বিনামূল্যে',
      'course.continue': 'চালিয়ে যান',
      'course.start': 'শুরু করুন',
      'course.review': 'পুনঃদর্শন',

      // Auth
      'auth.email': 'ইমেইল',
      'auth.password': 'পাসওয়ার্ড',
      'auth.confirm_password': 'পাসওয়ার্ড নিশ্চিত করুন',
      'auth.name': 'পূর্ণ নাম',
      'auth.phone': 'ফোন (ঐচ্ছিক)',
      'auth.role': 'আমি একজন',
      'auth.student': 'শিক্ষার্থী',
      'auth.instructor': 'শিক্ষক',
      'auth.login': 'লগ ইন',
      'auth.register': 'নিবন্ধন',
      'auth.forgot_password': 'পাসওয়ার্ড ভুলে গেছেন?',
      'auth.no_account': 'অ্যাকাউন্ট নেই?',
      'auth.have_account': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',

      // Dashboard
      'dash.welcome': 'স্বাগতম',
      'dash.continue_learning': 'শেখা চালিয়ে যান',
      'dash.enrolled_courses': 'ভর্তিকৃত কোর্স',
      'dash.in_progress': 'চলমান',
      'dash.completed': 'সম্পন্ন',
      'dash.certificates': 'সার্টিফিকেট',
      'dash.no_courses': 'এখনো কোনো কোর্স নেই',
      'dash.browse_now': 'মার্কেটপ্লেস দেখুন',
      'dash.complete': 'সম্পন্ন',

      // Payment
      'pay.checkout': 'নিরাপদ চেকআউট',
      'pay.summary': 'অর্ডার সারাংশ',
      'pay.method': 'পেমেন্ট পদ্ধতি নির্বাচন করুন',
      'pay.demo': 'ডেমো পে',
      'pay.card': 'কার্ড / Stripe',
      'pay.local': 'SSLCommerz',
      'pay.local_sub': 'বিকাশ, নগদ, কার্ড',
      'pay.total': 'মোট',
      'pay.processing': 'প্রক্রিয়াধীন...',
      'pay.success': 'পেমেন্ট সফল!',
      'pay.failed': 'পেমেন্ট ব্যর্থ',
      'pay.start': 'শেখা শুরু করুন',

      // Common
      'common.loading': 'লোড হচ্ছে...',
      'common.search': 'খুঁজুন...',
      'common.cancel': 'বাতিল',
      'common.save': 'সংরক্ষণ',
      'common.submit': 'জমা দিন',
      'common.delete': 'মুছুন',
      'common.edit': 'সম্পাদনা',
      'common.view': 'দেখুন',
      'common.back': 'ফিরে যান',

      // Chatbot
      'bot.title': 'LearnSpace সহকারী',
      'bot.placeholder': 'যেকোনো কিছু জিজ্ঞাসা করুন...',
      'bot.send': 'পাঠান',
      'bot.greeting': 'হাই! আজ আমি কিভাবে সাহায্য করতে পারি?',
      'bot.open': 'সহকারী খুলুন',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'learnspace-lang'
    }
  });

export default i18n;
