import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Database, 
  Mail,
  Eye,
  Server,
  FileText
} from 'lucide-react';

const PrivacyPolicyPage = () => {
  const sections = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Data Collection",
      content: "We collect only the information necessary to provide our health analysis services, including your name, email, and health metrics you choose to share."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Data Protection",
      content: "We do not sell user data. Your information is kept confidential and is only used to provide personalized health insights."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Data Storage",
      content: "Health data is stored securely using industry-standard encryption. All data is protected with secure access controls."
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Password Security",
      content: "Passwords are encrypted using secure hashing algorithms (bcrypt). We never store plain-text passwords."
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Usage",
      content: "Emails are used only for system notifications, health alerts, and password recovery. We do not send marketing emails without consent."
    },
    {
      icon: <Server className="h-6 w-6" />,
      title: "AI Processing",
      content: "AI responses are generated securely via OpenAI API. Your health data is processed in real-time and is not stored by the AI provider."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="privacy-policy-page">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                Privacy Policy
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                We value your privacy and are committed to protecting your personal information.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Policy Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8"
            >
              <p className="text-slate-600 leading-relaxed">
                This Privacy Policy describes how Health Analyzer ("we", "us", or "our") 
                collects, uses, and protects your personal information when you use our 
                health analysis platform. By using our services, you agree to the collection 
                and use of information in accordance with this policy.
              </p>
            </motion.div>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
                        {section.title}
                      </h3>
                      <p className="text-slate-600">{section.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Academic Disclaimer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <div className="flex items-start gap-4">
                <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Academic Purpose</h3>
                  <p className="text-blue-700 text-sm">
                    This system is developed for academic purposes. All data handling practices 
                    are designed with privacy in mind, following best practices for educational 
                    software development.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Last Updated */}
            <p className="text-sm text-slate-500 text-center mt-8">
              Last updated: January 2024
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
