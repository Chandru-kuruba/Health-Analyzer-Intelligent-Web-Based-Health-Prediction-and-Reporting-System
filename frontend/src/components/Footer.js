import { Link } from 'react-router-dom';
import { HeartPulse, Mail, Phone, MapPin, Code, GraduationCap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <HeartPulse className="h-6 w-6 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-white">
                Health<span className="text-primary">Analyzer</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-sm">
              Intelligent Web-Based Health Prediction and Reporting System powered by AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>chandru.h@cmr.edu.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+91 80 2542 6900</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span>CMR University<br />OMBR Layout, Banaswadi<br />Bengaluru, Karnataka 560043<br />India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Developers Section */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-5 w-5 text-primary" />
              <h4 className="font-heading font-semibold text-white">Developed By</h4>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <p className="text-white font-medium">Chandru H</p>
                <p className="text-xs text-slate-500">23DBCAD021</p>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Akash B</p>
                <p className="text-xs text-slate-500">23DBCAD007</p>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Gopi Reddy Manoj Kumar</p>
                <p className="text-xs text-slate-500">23DBCAD030</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>6th Sem BCA DS 'A sec' | SSCS | CMR University</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800 pt-6">
            <p className="text-sm text-slate-500">
              © 2024 Health Analyzer. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <p className="text-xs text-slate-600 text-center mt-4">
            Medical Disclaimer: This system provides informational predictions only and does not replace professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
};
