import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../services/healthApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  User, 
  Activity, 
  MessageSquare, 
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';


// Form validation schema
const assessmentSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.coerce.number().min(1, 'Age must be positive').max(150, 'Invalid age'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Please select a gender' }),
  height: z.coerce.number().min(1, 'Height must be positive').max(300, 'Invalid height'),
  weight: z.coerce.number().min(1, 'Weight must be positive').max(500, 'Invalid weight'),
  blood_sugar_level: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).max(1000).optional()
  ),
  blood_pressure_systolic: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(50).max(300).optional()
  ),
  blood_pressure_diastolic: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(30).max(200).optional()
  ),
  symptoms: z.string().optional(),
});

const HealthAssessment = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      full_name: user?.name || '',
      email: user?.email || '',
      age: '',
      dob: '',
      gender: '',
      height: '',
      weight: '',
      blood_sugar_level: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      symptoms: ''
    }
  });

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Health Metrics', icon: Activity },
    { id: 3, title: 'Symptoms', icon: MessageSquare },
    { id: 4, title: 'Image Upload', icon: Upload }
  ];

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
        toast.error('Please upload a JPG or PNG image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['full_name', 'email', 'age', 'dob', 'gender'];
    if (step === 2) fieldsToValidate = ['height', 'weight'];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Convert empty strings to null for optional fields
      const payload = {
        full_name: data.full_name,
        email: data.email,
        age: data.age,
        dob: data.dob,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        blood_sugar_level: data.blood_sugar_level || null,
        blood_pressure_systolic: data.blood_pressure_systolic || null,
        blood_pressure_diastolic: data.blood_pressure_diastolic || null,
        symptoms: data.symptoms || null,
        image_data: imageData
      };

      toast.loading('AI is analyzing your health data...', { id: 'ai-analysis' });
      const result = await healthApi.createAssessment(payload, token);
      toast.dismiss('ai-analysis');
      
      if (result.ai_triage?.emergencyAlert) {
        toast.error('Emergency condition detected! Please seek immediate medical attention.');
      } else {
        toast.success('AI health analysis completed!');
      }
      
      navigate(`/report/${result.id}`);
    } catch (error) {
      console.error('Assessment error:', error);
      toast.dismiss('ai-analysis');
      toast.error(error.response?.data?.detail || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-heading font-bold text-slate-900">
              Health Assessment
            </h1>
            <p className="mt-2 text-slate-600">
              Complete the form below for a comprehensive health analysis
            </p>
          </motion.div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((s) => (
                <div 
                  key={s.id} 
                  className={`flex items-center gap-2 ${step >= s.id ? 'text-primary' : 'text-slate-400'}`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step > s.id ? 'bg-primary text-white' : step === s.id ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-slate-100 text-slate-400'}
                  `}>
                    {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{s.title}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Form */}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const StepIcon = steps[step - 1].icon;
                  return <StepIcon className="h-5 w-5 text-primary" />;
                })()}
                {steps[step - 1].title}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Enter your personal information'}
                {step === 2 && 'Enter your health metrics'}
                {step === 3 && 'Describe any symptoms you are experiencing'}
                {step === 4 && 'Upload an image for analysis (optional)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  {/* Step 1: Personal Info */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            {...register('full_name')}
                            placeholder="John Doe"
                            data-testid="full-name-input"
                          />
                          {errors.full_name && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.full_name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="john@example.com"
                            data-testid="email-input"
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="age">Age *</Label>
                          <Input
                            id="age"
                            type="number"
                            {...register('age')}
                            placeholder="35"
                            data-testid="age-input"
                          />
                          {errors.age && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.age.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dob">Date of Birth *</Label>
                          <Input
                            id="dob"
                            type="date"
                            {...register('dob')}
                            data-testid="dob-input"
                          />
                          {errors.dob && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.dob.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender *</Label>
                          <select
                            id="gender"
                            {...register('gender')}
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E86C1] focus-visible:ring-offset-2"
                            data-testid="gender-select"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          {errors.gender && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.gender.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Health Metrics */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm) *</Label>
                          <Input
                            id="height"
                            type="number"
                            step="0.1"
                            {...register('height')}
                            placeholder="170"
                            data-testid="height-input"
                          />
                          {errors.height && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.height.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg) *</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            {...register('weight')}
                            placeholder="70"
                            data-testid="weight-input"
                          />
                          {errors.weight && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.weight.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="blood_sugar_level">Blood Sugar Level (mg/dL)</Label>
                        <Input
                          id="blood_sugar_level"
                          type="number"
                          {...register('blood_sugar_level')}
                          placeholder="Optional - e.g., 100"
                          data-testid="blood-sugar-input"
                        />
                        <p className="text-xs text-slate-500">Normal fasting: 70-100 mg/dL</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="blood_pressure_systolic">Blood Pressure - Systolic</Label>
                          <Input
                            id="blood_pressure_systolic"
                            type="number"
                            {...register('blood_pressure_systolic')}
                            placeholder="Optional - e.g., 120"
                            data-testid="bp-systolic-input"
                          />
                          <p className="text-xs text-slate-500">Normal: Less than 120</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="blood_pressure_diastolic">Blood Pressure - Diastolic</Label>
                          <Input
                            id="blood_pressure_diastolic"
                            type="number"
                            {...register('blood_pressure_diastolic')}
                            placeholder="Optional - e.g., 80"
                            data-testid="bp-diastolic-input"
                          />
                          <p className="text-xs text-slate-500">Normal: Less than 80</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Symptoms */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="symptoms">Symptoms</Label>
                        <Textarea
                          id="symptoms"
                          {...register('symptoms')}
                          placeholder="Describe any symptoms you're experiencing (e.g., headache, fatigue, chest pain, shortness of breath...)"
                          className="min-h-[150px]"
                          data-testid="symptoms-input"
                        />
                        <p className="text-xs text-slate-500">
                          Be specific about your symptoms for better analysis
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-800 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Symptom Examples
                        </h4>
                        <ul className="mt-2 text-sm text-amber-700 space-y-1">
                          <li>• Chest pain, shortness of breath, heart palpitations</li>
                          <li>• Excessive thirst, frequent urination, blurred vision</li>
                          <li>• Headache, dizziness, fatigue, numbness</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Image Upload */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>Upload Image (Optional)</Label>
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                            data-testid="image-upload-input"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            {imagePreview ? (
                              <div className="space-y-4">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="max-h-48 mx-auto rounded-lg"
                                />
                                <p className="text-sm text-slate-500">Click to change image</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                                <p className="text-slate-600">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-slate-400">
                                  JPG, PNG up to 5MB
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800">Image Analysis</h4>
                        <p className="mt-1 text-sm text-blue-700">
                          Our AI-powered system can analyze images for potential skin conditions, 
                          wounds, or other visible health indicators. This is a simulated analysis 
                          for demonstration purposes.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-primary hover:bg-primary-dark flex items-center gap-2"
                      data-testid="next-step-btn"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary hover:bg-primary-dark flex items-center gap-2 min-w-[160px]"
                      data-testid="submit-assessment-btn"
                      onClick={(e) => {
                        // Force form submission if type="submit" doesn't work
                        if (!submitting) {
                          handleSubmit(onSubmit)(e);
                        }
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          AI Analyzing...
                        </>
                      ) : (
                        <>
                          Start AI Analysis
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Medical Disclaimer */}
          <p className="mt-6 text-xs text-slate-500 text-center">
            <strong>Disclaimer:</strong> This assessment provides informational predictions only 
            and does not replace professional medical advice.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HealthAssessment;
