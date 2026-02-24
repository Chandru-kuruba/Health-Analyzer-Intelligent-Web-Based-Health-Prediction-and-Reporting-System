import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  ScanLine, 
  MessageCircle, 
  FileText, 
  Mail,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Heart,
  Brain,
  Shield
} from 'lucide-react';

const FeaturesPage = () => {
  const coreFeatures = [
    {
      icon: <Stethoscope className="h-8 w-8" />,
      title: "AI Powered Health Assessment",
      description: "Provides deep symptom-based analysis including:",
      points: [
        "Risk scoring",
        "Severity classification",
        "Preventive suggestions",
        "Lifestyle recommendations"
      ]
    },
    {
      icon: <ScanLine className="h-8 w-8" />,
      title: "Medical Image Analyzer",
      description: "Upload medical-related images such as:",
      imageTypes: ["Skin conditions", "Visible injuries", "Swelling", "Wounds"],
      provides: [
        "Possible condition",
        "Severity estimation",
        "Recommended next steps",
        "Medical disclaimer"
      ]
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Medical-Only AI Chat",
      description: "The AI assistant answers only:",
      points: [
        "Medical queries",
        "Health concerns",
        "First aid guidance",
        "Wellness advice"
      ],
      note: "Non-medical queries are restricted."
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Professional Health Reports",
      description: "Download structured PDF reports including:",
      points: [
        "Patient summary",
        "Risk analysis",
        "Recommendations",
        "Emergency warning (if applicable)"
      ]
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Alerts",
      description: "Users receive:",
      points: [
        "Assessment summaries",
        "Critical warnings",
        "Password reset links"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="features-page">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Activity className="h-4 w-4" />
                Platform Features
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                Core Features
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Explore the powerful AI-driven features that make Health Analyzer your 
                comprehensive health companion.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="space-y-8">
              {/* Feature 1 - AI Health Assessment */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="p-4 bg-primary/10 rounded-xl h-fit text-primary">
                    <Stethoscope className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                      1. AI Powered Health Assessment
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Provides deep symptom-based analysis including:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {["Risk scoring", "Severity classification", "Preventive suggestions", "Lifestyle recommendations"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 - Medical Image Analyzer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="p-4 bg-emerald-100 rounded-xl h-fit text-emerald-600">
                    <ScanLine className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                      2. Medical Image Analyzer
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Upload medical-related images such as:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["Skin conditions", "Visible injuries", "Swelling", "Wounds"].map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-600 mb-3">The system provides:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {["Possible condition", "Severity estimation", "Recommended next steps", "Medical disclaimer"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 - Medical-Only AI Chat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="p-4 bg-blue-100 rounded-xl h-fit text-blue-600">
                    <MessageCircle className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                      3. Medical-Only AI Chat
                    </h3>
                    <p className="text-slate-600 mb-4">
                      The AI assistant answers only:
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {["Medical queries", "Health concerns", "First aid guidance", "Wellness advice"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-800 text-sm font-medium">Non-medical queries are restricted.</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 4 - Professional Health Reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="p-4 bg-purple-100 rounded-xl h-fit text-purple-600">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                      4. Professional Health Reports
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Download structured PDF reports including:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {["Patient summary", "Risk analysis", "Recommendations", "Emergency warning (if applicable)"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 5 - Email Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="p-4 bg-red-100 rounded-xl h-fit text-red-600">
                    <Mail className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                      5. Email Alerts
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Users receive:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {["Assessment summaries", "Critical warnings", "Password reset links"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Security Banner */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white text-center"
            >
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-2xl font-heading font-bold mb-2">Secure & Private</h3>
              <p className="opacity-90 max-w-xl mx-auto">
                Your health data is encrypted and stored securely. We never share your 
                personal information with third parties.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
