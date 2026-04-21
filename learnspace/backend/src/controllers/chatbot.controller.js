// ============================================================
// LearnSpace - Chatbot Controller
// Rule-based FAQ assistant. No external LLM required.
// Matches user message against intents using keyword scoring,
// falls back to a "I don't know, here are common questions" reply.
// ============================================================
const { Course, Enrollment, Certificate } = require('../models');
const logger = require('../utils/logger');

// Each intent has trigger keywords (lowercased) and a response template
// or a function that fetches dynamic data.
const INTENTS = [
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'salam', 'assalam', 'হাই', 'হ্যালো', 'নমস্কার'],
    response: () => 'Hello! 👋 I\'m the LearnSpace assistant. I can help with: finding courses, enrollment, payments, certificates, account help. What do you need?'
  },
  {
    id: 'browse_courses',
    keywords: ['course', 'browse', 'find', 'search', 'marketplace', 'কোর্স', 'খুঁজ'],
    response: () => 'Browse all available courses at the Marketplace page. You can filter by category, level, language, and price. Click "Browse Courses" in the top navigation.'
  },
  {
    id: 'enroll',
    keywords: ['enroll', 'join course', 'sign up for', 'admission', 'ভর্তি', 'এনরোল'],
    response: () => 'To enroll: open any course detail page → click "Enroll Now". Free courses give instant access. Paid courses go through checkout.'
  },
  {
    id: 'payment',
    keywords: ['pay', 'payment', 'price', 'cost', 'fee', 'sslcommerz', 'bkash', 'nagad', 'stripe', 'card', 'পেমেন্ট', 'টাকা', 'মূল্য'],
    response: () => 'We support: SSLCommerz (bKash, Nagad, cards — Bangladesh), Stripe (international cards), and Demo Pay (testing). Pricing is shown on every course page in BDT (৳).'
  },
  {
    id: 'refund',
    keywords: ['refund', 'money back', 'cancel', 'return', 'রিফান্ড', 'ফেরত'],
    response: () => 'We offer a 30-day money-back guarantee. To request a refund, contact admin support with your order ID. Refunds are processed within 5–7 business days.'
  },
  {
    id: 'certificate',
    keywords: ['certificate', 'cert', 'completion', 'সার্টিফিকেট', 'পরীক্ষা'],
    response: () => 'Once you finish 100% of a course, your certificate is generated automatically. View and download all certificates from "My Certificates" in your dashboard. Each certificate is verifiable by its unique number.'
  },
  {
    id: 'progress',
    keywords: ['progress', 'track', 'completion', 'percentage', 'অগ্রগতি'],
    response: () => 'Your progress is tracked automatically as you watch lessons. Check the progress bar on each course card in "My Courses".'
  },
  {
    id: 'instructor_apply',
    keywords: ['instructor', 'teach', 'create course', 'become teacher', 'শিক্ষক', 'টিচার'],
    response: () => 'To become an instructor: register with the "instructor" role, then submit your verification documents (NID + qualifications) from your dashboard. Admin will review within 2-3 business days.'
  },
  {
    id: 'login_problem',
    keywords: ['forgot password', 'reset', 'can\'t login', 'cant login', 'পাসওয়ার্ড'],
    response: () => 'Use the "Forgot Password" link on the login page. We\'ll send a reset link to your email. The reset token expires in 15 minutes.'
  },
  {
    id: 'language',
    keywords: ['bangla', 'english', 'language', 'বাংলা', 'ইংরেজি', 'ভাষা'],
    response: () => 'LearnSpace supports both Bangla (বাংলা) and English. Use the language switcher in the top navigation bar. Course content language is shown on each course card.'
  },
  {
    id: 'contact',
    keywords: ['contact', 'support', 'help', 'human', 'agent', 'সাহায্য', 'যোগাযোগ'],
    response: () => 'For human support, use the "Contact Us" link in the footer or email support@learnspace.com. Our team responds within 24 hours.'
  }
];

// Dynamic intents — need user data
const DYNAMIC_INTENTS = [
  {
    id: 'my_enrollments',
    keywords: ['my courses', 'my enrolled', 'enrollments', 'my classes', 'আমার কোর্স'],
    handler: async (userId) => {
      if (!userId) return 'Please log in first to see your enrolled courses.';
      const enrollments = await Enrollment.find({ student_id: userId, status: 'active' })
        .populate('course_id', 'title')
        .limit(5)
        .lean();
      if (enrollments.length === 0) {
        return 'You haven\'t enrolled in any course yet. Browse the marketplace to find one!';
      }
      const list = enrollments.map(e => `• ${e.course_id?.title || 'Untitled'} (${Math.round(e.progress_percent || 0)}%)`).join('\n');
      return `You're enrolled in ${enrollments.length} active course${enrollments.length > 1 ? 's' : ''}:\n${list}\n\nGo to "My Courses" to continue learning.`;
    }
  },
  {
    id: 'my_certificates',
    keywords: ['my certificate', 'my certificates', 'my certs'],
    handler: async (userId) => {
      if (!userId) return 'Please log in first to see your certificates.';
      const count = await Certificate.countDocuments({ student_id: userId });
      return count === 0
        ? 'You haven\'t earned any certificate yet. Complete a course to earn your first one! 🎓'
        : `You have ${count} certificate${count > 1 ? 's' : ''}. View them at "My Certificates".`;
    }
  }
];

const FALLBACK = `I'm not sure how to help with that. Here are some things I can answer:

• How do I enroll in a course?
• How does payment work?
• How do I get a certificate?
• How do I become an instructor?
• I forgot my password
• My courses / My certificates

Try asking one of these, or contact human support from the footer.`;

const score = (text, keywords) => {
  const lower = text.toLowerCase();
  let s = 0;
  for (const k of keywords) {
    if (lower.includes(k.toLowerCase())) s += k.length; // longer match = stronger signal
  }
  return s;
};

const handleMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const text = message.trim().slice(0, 500); // cap length
    const userId = req.user?.id;

    // Try dynamic intents first (more specific)
    let best = { intent: null, score: 0, dynamic: false };
    for (const intent of DYNAMIC_INTENTS) {
      const s = score(text, intent.keywords);
      if (s > best.score) best = { intent, score: s, dynamic: true };
    }
    for (const intent of INTENTS) {
      const s = score(text, intent.keywords);
      if (s > best.score) best = { intent, score: s, dynamic: false };
    }

    let reply;
    let intentId = 'fallback';
    if (best.score === 0) {
      reply = FALLBACK;
    } else {
      intentId = best.intent.id;
      reply = best.dynamic
        ? await best.intent.handler(userId)
        : best.intent.response();
    }

    return res.json({
      success: true,
      data: {
        reply,
        intent: intentId,
        suggestions: ['How do I enroll?', 'Payment methods?', 'My courses', 'Get certificate']
      }
    });
  } catch (error) {
    logger.error('Chatbot error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Chatbot error.',
      data: { reply: 'Sorry, I had trouble processing that. Please try again.' }
    });
  }
};

module.exports = { handleMessage };
