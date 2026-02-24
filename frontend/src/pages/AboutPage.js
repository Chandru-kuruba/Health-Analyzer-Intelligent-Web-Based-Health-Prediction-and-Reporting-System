import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { 
  HeartPulse, 
  Target, 
  Shield, 
  Stethoscope, 
  MessageCircle, 
  FileText,
  AlertTriangle,
  Mail,
  Users
} from 'lucide-react';

const AboutPage = () => {
  const features = [
    {
      icon: <Stethoscope className="h-6 w-6" />,
      title: "AI-Powered Health Assessment",
      description: "Advanced AI analysis for comprehensive health evaluation"
    },
    {
      icon: <HeartPulse className="h-6 w-6" />,
      title: "Medical Image Analysis",
      description: "Upload and analyze medical images with AI precision"
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Health Chat Assistant",
      description: "Medical-only AI chat for health-related queries"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Structured Health Reports",
      description: "Download professional PDF health reports"
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "Risk Level Prediction",
      description: "Intelligent risk assessment and severity classification"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Notifications",
      description: "Receive health alerts and reports via email"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="about-page">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <HeartPulse className="h-4 w-4" />
                About Health Analyzer
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                Intelligent Health Prediction & Reporting System
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Health Analyzer is an intelligent web-based health prediction and reporting system 
                designed to provide users with AI-powered health assessments, medical image analysis, 
                and personalized health recommendations.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                    Our Mission
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    To make preliminary health insights accessible, structured, and easy to understand 
                    for everyone. The platform integrates modern AI models with a secure backend to 
                    generate structured medical reports, risk assessments, and preventive guidance.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mt-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                    Our Vision
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    To empower individuals with early health awareness through technology-driven 
                    medical assistance. We believe in making healthcare insights accessible to 
                    everyone, anywhere, anytime.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What We Provide Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">
                What We Provide
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Comprehensive AI-powered health tools designed to help you understand 
                and manage your health better.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-primary/30 transition-colors"
                >
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Users className="h-4 w-4" />
                Our Team
              </div>
              <h2 className="text-3xl font-heading font-bold text-slate-900 mb-8">
                Developed By
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Chandru H", usn: "23DBCAD021" },
                  { name: "Akash B", usn: "23DBCAD007" },
                  { name: "Gopi Reddy Manoj Kumar", usn: "23DBCAD030" }
                ].map((dev, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary">
                        {dev.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-slate-900">{dev.name}</h3>
                    <p className="text-sm text-slate-500">USN: {dev.usn}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-600">
                  <strong className="text-slate-900">Course:</strong> 6th Sem BCA DS 'A sec'
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-900">School:</strong> SSCS
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-900">University:</strong> CMR University
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
