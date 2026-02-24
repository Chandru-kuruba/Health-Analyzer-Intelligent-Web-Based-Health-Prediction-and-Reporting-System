import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { 
  Check, 
  X,
  Sparkles,
  GraduationCap
} from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: "Free Plan",
      price: "0",
      description: "Basic health features for everyone",
      features: [
        { name: "Basic health assessment", included: true },
        { name: "Limited chat access", included: true },
        { name: "Image analysis (basic)", included: true },
        { name: "Standard risk scoring", included: true },
        { name: "PDF reports", included: true },
        { name: "Advanced AI analysis", included: false },
        { name: "Unlimited chat", included: false },
        { name: "Priority email alerts", included: false },
      ],
      current: true
    },
    {
      name: "Pro Plan",
      price: "Coming Soon",
      description: "Advanced features for health enthusiasts",
      features: [
        { name: "Basic health assessment", included: true },
        { name: "Unlimited chat access", included: true },
        { name: "Advanced image analysis", included: true },
        { name: "Detailed risk scoring", included: true },
        { name: "PDF reports", included: true },
        { name: "Advanced AI analysis", included: true },
        { name: "Unlimited chat", included: true },
        { name: "Priority email alerts", included: true },
      ],
      future: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="pricing-page">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Pricing Plans
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Get started with our free plan or unlock advanced features with Pro.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-2xl p-8 shadow-sm border-2 ${
                    plan.current ? 'border-primary' : 'border-slate-200'
                  }`}
                >
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}
                  {plan.future && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-slate-600 text-white text-xs font-medium rounded-full">
                        Future Scope
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-2">
                      {plan.price === "0" ? (
                        <span className="text-4xl font-bold text-slate-900">Free</span>
                      ) : (
                        <span className="text-2xl font-bold text-slate-500">{plan.price}</span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">{plan.description}</p>
                  </div>

                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full mt-8 py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.current
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-slate-100 text-slate-600 cursor-not-allowed'
                    }`}
                    disabled={plan.future}
                  >
                    {plan.current ? 'Get Started' : 'Coming Soon'}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Academic Notice */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center"
            >
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-heading font-bold text-blue-900 mb-2">
                Academic Project
              </h3>
              <p className="text-blue-700">
                This platform is currently developed for academic and research purposes. 
                All features are available for free during this phase.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
