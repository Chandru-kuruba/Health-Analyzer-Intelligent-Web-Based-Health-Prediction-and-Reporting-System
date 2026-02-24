import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  Building,
  Send
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="contact-page">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Mail className="h-4 w-4" />
                Contact Us
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                Get in Touch
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                For academic or project-related inquiries, feel free to reach out to us.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Email</h3>
                      <p className="text-slate-600">chandru.h@cmr.edu.in</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Phone</h3>
                      <p className="text-slate-600">+91 80 2542 6900</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">University</h3>
                      <p className="text-slate-600">CMR University</p>
                      <p className="text-slate-500 text-sm">School of Computer Science (SSCS)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Address</h3>
                      <p className="text-slate-600">
                        CMR University<br />
                        OMBR Layout, Banaswadi<br />
                        Bengaluru, Karnataka 560043<br />
                        India
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Notice */}
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Academic Project</h3>
                  </div>
                  <p className="text-blue-700 text-sm">
                    This project is developed as part of the 6th Semester BCA DS curriculum 
                    at CMR University. For academic collaborations or inquiries, please use 
                    the contact information provided.
                  </p>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">
                    Send a Message
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        placeholder="How can we help?"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
