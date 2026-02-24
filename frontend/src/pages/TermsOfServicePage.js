import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertTriangle, 
  Stethoscope,
  MessageCircle,
  Image,
  GraduationCap,
  CheckCircle2
} from 'lucide-react';

const TermsOfServicePage = () => {
  const terms = [
    {
      icon: <Stethoscope className="h-6 w-6" />,
      title: "Preliminary Health Insights",
      content: "This system provides preliminary health insights only. The AI-powered analysis is for informational purposes and should not be considered medical advice."
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "Not a Medical Replacement",
      content: "Health Analyzer does not replace professional medical consultation. Always consult qualified healthcare professionals for diagnosis and treatment."
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "AI Chat Usage",
      content: "Users must not misuse the AI assistant. The chat is restricted to medical and health-related queries only. Non-medical questions will be declined."
    },
    {
      icon: <Image className="h-6 w-6" />,
      title: "Image Upload Guidelines",
      content: "Uploaded images must be medical-related (skin conditions, wounds, etc.). Non-medical images will be identified and rejected by the system."
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Academic Purpose",
      content: "The system is developed for academic and research purposes. Features may be updated or modified as part of ongoing development."
    }
  ];

  const userAgreements = [
    "I understand this system provides preliminary health insights only",
    "I will not rely on this system as a replacement for professional medical advice",
    "I will use the AI assistant responsibly for health-related queries",
    "I will only upload medical-related images for analysis",
    "I understand this is an academic project and may have limitations"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="terms-of-service-page">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <FileText className="h-4 w-4" />
                Terms of Service
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                Terms of Service
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Please read these terms carefully before using Health Analyzer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8"
            >
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">
                By using this platform, you agree to the following terms:
              </h2>
              <p className="text-slate-600 leading-relaxed">
                These Terms of Service govern your use of Health Analyzer. By accessing or 
                using our services, you acknowledge that you have read, understood, and agree 
                to be bound by these terms.
              </p>
            </motion.div>

            <div className="space-y-6">
              {terms.map((term, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                      {term.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
                        {term.title}
                      </h3>
                      <p className="text-slate-600">{term.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* User Agreement Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 bg-slate-900 rounded-2xl p-8 text-white"
            >
              <h3 className="text-xl font-heading font-bold mb-6">
                User Agreement
              </h3>
              <p className="text-slate-300 mb-6">
                By using Health Analyzer, you acknowledge and agree to the following:
              </p>
              <ul className="space-y-3">
                {userAgreements.map((agreement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{agreement}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Medical Disclaimer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Medical Disclaimer</h3>
                  <p className="text-amber-800 text-sm">
                    The information provided by Health Analyzer is for general informational 
                    purposes only. All information on the platform is provided in good faith, 
                    however we make no representation or warranty of any kind regarding the 
                    accuracy, adequacy, validity, or completeness of any information provided. 
                    Under no circumstance shall we have any liability for any loss or damage 
                    incurred as a result of the use of the platform.
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

export default TermsOfServicePage;
