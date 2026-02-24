import { Button } from '../components/ui/button';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  HeartPulse, 
  FileText, 
  ScanLine, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Activity,
  Brain
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: HeartPulse,
      title: 'Comprehensive Health Analysis',
      description: 'Input your health metrics including BMI, blood pressure, blood sugar, and symptoms for a complete health assessment.'
    },
    {
      icon: ScanLine,
      title: 'AI-Powered Image Analysis',
      description: 'Upload images for intelligent skin condition analysis using our advanced ML-powered detection system.'
    },
    {
      icon: Brain,
      title: 'Smart Risk Assessment',
      description: 'Our rule-based engine analyzes your data to identify potential health risks and provide personalized recommendations.'
    },
    {
      icon: FileText,
      title: 'Professional PDF Reports',
      description: 'Generate detailed health reports in PDF format, perfect for sharing with healthcare providers.'
    }
  ];

  const benefits = [
    'Track health metrics over time',
    'Get personalized recommendations',
    'Secure and private data handling',
    'Email reports directly to your inbox',
    'Mobile-friendly interface',
    'Professional medical-grade reports'
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              className="lg:col-span-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Activity className="h-4 w-4" />
                Intelligent Health Insights
              </span>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-slate-900 tracking-tight leading-tight">
                Your Health,{' '}
                <span className="text-primary">Analyzed</span>{' '}
                with Precision
              </h1>
              
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Get comprehensive health assessments powered by intelligent analysis. 
                Track your metrics, identify risks, and receive personalized recommendations 
                for a healthier life.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-6 text-lg shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-transform"
                  data-testid="hero-cta-btn"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Start Free Assessment'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/about')}
                  className="border-slate-200 text-slate-700 px-8 py-6 text-lg hover:bg-slate-50"
                >
                  Learn More
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:col-span-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl transform rotate-3"></div>
                <img
                  src="https://images.unsplash.com/photo-1758691461935-202e2ef6b69f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwyfHxtZWRpY2FsJTIwZG9jdG9yJTIwcHJvZmVzc2lvbmFsJTIwY29uc3VsdGF0aW9ufGVufDB8fHx8MTc3MTg0NjU3OXww&ixlib=rb-4.1.0&q=85"
                  alt="Professional doctor consulting with patient"
                  className="relative rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
              Comprehensive Health Features
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to monitor and understand your health metrics in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-3 bg-primary/10 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-heading font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
                Why Choose Health Analyzer?
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                We combine advanced technology with medical expertise to provide 
                you with accurate, actionable health insights.
              </p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => navigate(isAuthenticated ? '/assess' : '/register')}
                className="mt-8 bg-primary hover:bg-primary-dark text-white"
                data-testid="benefits-cta-btn"
              >
                {isAuthenticated ? 'Start New Assessment' : 'Get Started Free'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.pexels.com/photos/8417426/pexels-photo-8417426.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Active senior woman jogging outdoors"
                className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
              Ready to Take Control of Your Health?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of users who trust Health Analyzer for their health insights.
            </p>
            <Button 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="mt-8 bg-white text-primary hover:bg-blue-50 px-8 py-6 text-lg"
              data-testid="cta-btn"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-8 bg-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">
            <strong>Medical Disclaimer:</strong> This system provides informational predictions only 
            and does not replace professional medical advice, diagnosis, or treatment. Always seek 
            the advice of your physician or other qualified health provider with any questions you 
            may have regarding a medical condition.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
