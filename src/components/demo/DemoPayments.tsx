import { useState } from 'react';
import {
  CreditCard, Smartphone, CheckCircle, AlertCircle, Clock, DollarSign,
  ArrowRight, RefreshCw, Mail, MessageSquare, ChevronRight, Shield, Settings, Fingerprint
} from 'lucide-react';

type PaymentView = 'checkout' | 'plans' | 'recovery' | 'success' | 'config';

interface CartItem {
  id: string;
  childName: string;
  programName: string;
  schedule: string;
  price: number;
}

export function DemoPayments() {
  const [view, setView] = useState<PaymentView>('checkout');
  const [selectedPlan, setSelectedPlan] = useState<'full' | 'monthly' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(0);

  const cartItems: CartItem[] = [
    {
      id: '1',
      childName: 'Connor',
      programName: 'Mini Soccer',
      schedule: 'Saturday 9:00 AM at Lincoln Park',
      price: 169
    },
    {
      id: '2',
      childName: 'Emma',
      programName: 'Dance Academy',
      schedule: 'Tuesday 4:30 PM at Downtown Center',
      price: 189
    }
  ];

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const monthlyPrice = Math.ceil(totalPrice / 4);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setView('success');
    }, 2000);
  };

  const simulateRecovery = () => {
    if (recoveryStep < 3) {
      setRecoveryStep(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'checkout', label: 'Checkout Flow' },
          { id: 'plans', label: 'Payment Plans' },
          { id: 'config', label: 'Plan Config' },
          { id: 'recovery', label: 'Cart Recovery' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setView(tab.id as PaymentView); setRecoveryStep(0); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'checkout' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {cartItems.map((item, idx) => (
                <div key={item.id} className={`p-4 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.programName}</h3>
                      <p className="text-sm text-slate-600">for {item.childName}</p>
                      <p className="text-sm text-slate-500">{item.schedule}</p>
                    </div>
                    <p className="font-bold text-slate-900">${item.price}</p>
                  </div>
                </div>
              ))}
              <div className="bg-slate-50 p-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">${totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Sibling Discount Available!</h4>
                  <p className="text-sm text-amber-700">Save $20 when enrolling multiple children. Applied at checkout.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Method</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex gap-4 mb-6">
                <button className="flex-1 p-4 border-2 border-blue-500 bg-blue-50 rounded-xl flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Card</span>
                </button>
                <button className="flex-1 p-4 border-2 border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:border-slate-300">
                  <Smartphone className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Apple Pay</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Pay ${totalPrice - 20} (with discount)
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Secured by Stripe. Your card info is encrypted.
              </p>
            </div>
          </div>
        </div>
      )}

      {view === 'plans' && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Choose Payment Option</h2>
          <p className="text-slate-600 mb-6">Select the plan that works best for your family. All plans include sibling discount.</p>

          <div className="space-y-4">
            <button
              onClick={() => setSelectedPlan('full')}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                selectedPlan === 'full'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">Pay in Full</h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Save $20</span>
                  </div>
                  <p className="text-sm text-slate-600">One-time payment, best value</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">${totalPrice - 20}</div>
                  <div className="text-sm text-slate-500 line-through">${totalPrice}</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">Plan Type 1: Divided Payments</h3>
                  </div>
                  <p className="text-sm text-slate-600">3 payments spread across the season, final payment 30 days before last class</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">${Math.ceil(totalPrice / 3)}<span className="text-sm text-slate-500">/payment</span></div>
                  <div className="text-sm text-slate-500">3 payments</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all border-slate-200 hover:border-slate-300`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">Plan Type 2: Monthly Subscription</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Flexible</span>
                  </div>
                  <p className="text-sm text-slate-600">Monthly payments, cancel with 30-day notice, same day each month</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">${monthlyPrice}<span className="text-sm text-slate-500">/mo</span></div>
                  <div className="text-sm text-slate-500">Ongoing</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all border-slate-200 hover:border-slate-300`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">Plan Type 3: Two-Payment Split</h3>
                  </div>
                  <p className="text-sm text-slate-600">50% now at registration, 50% at season halfway point</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">${Math.ceil(totalPrice / 2)}<span className="text-sm text-slate-500">/payment</span></div>
                  <div className="text-sm text-slate-500">2 payments</div>
                </div>
              </div>
            </button>
          </div>

          {selectedPlan === 'monthly' && (
            <div className="mt-6 p-6 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-900 mb-4">Payment Schedule (Divided Payments)</h4>
              <div className="space-y-3">
                {[
                  { label: 'Today (Registration)', amount: Math.ceil(totalPrice / 3) },
                  { label: 'Week 4 (Mid-season)', amount: Math.ceil(totalPrice / 3) },
                  { label: '30 days before last class', amount: Math.ceil(totalPrice / 3) },
                ].map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-slate-700">{payment.label}</span>
                    </div>
                    <span className="font-semibold text-slate-900">${payment.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Payment Plan Fee</h4>
                <p className="text-sm text-amber-700">Payment plans include a $10 processing fee. Pay in full to waive this fee and save an additional $20!</p>
              </div>
            </div>
          </div>

          {selectedPlan && (
            <button
              onClick={handlePayment}
              className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Continue to Payment
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {view === 'config' && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Plan Configuration</h2>
          <p className="text-slate-600 mb-6">Business owners can customize payment options for their organization.</p>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Plan Type 1: Divided Payments</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Enable Divided Payments</p>
                    <p className="text-sm text-slate-500">Allow families to split total into multiple payments</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Payments</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option>2 payments</option>
                    <option selected>3 payments</option>
                    <option>4 payments</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Final Payment Due Before Last Class</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option>14 days</option>
                    <option selected>30 days</option>
                    <option>45 days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Plan Type 2: Subscription (Monthly)</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Enable Monthly Subscription</p>
                    <p className="text-sm text-slate-500">Allow ongoing monthly payments with cancellation option</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Day</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option>1st of month</option>
                    <option selected>7 days before next month</option>
                    <option>Same day as registration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Notice Required</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option>14 days</option>
                    <option selected>30 days</option>
                    <option>No notice required</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Fees & Markups</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Fee (Flat)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">$</span>
                    <input type="number" defaultValue="15" className="w-24 px-3 py-2 border border-slate-200 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Plan Fee (Flat)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">$</span>
                    <input type="number" defaultValue="10" className="w-24 px-3 py-2 border border-slate-200 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Credit Card Fee (Percentage)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue="3" step="0.1" className="w-24 px-3 py-2 border border-slate-200 rounded-lg" />
                    <span className="text-slate-500">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-medium text-slate-900">Waive Fees for Pay-in-Full</p>
                    <p className="text-sm text-slate-500">Incentivize full payment by waiving fees</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Biometric Authentication</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Enable Face ID / Touch ID</p>
                    <p className="text-sm text-slate-500">Allow families to log in and confirm payments with biometrics</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">Biometric data is stored on device only. Kairo never stores biometric information on our servers.</p>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
            Save Configuration
          </button>
        </div>
      )}

      {view === 'recovery' && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Abandoned Cart Recovery</h2>
          <p className="text-slate-600 mb-6">
            Automated multi-touch sequences recover up to 35% of abandoned registrations.
          </p>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Cart Abandoned</h3>
                  <p className="text-red-700 text-sm">Sarah Johnson left 2 items in cart 45 minutes ago</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-medium text-slate-900 mb-4">Recovery Sequence</h4>
              <div className="space-y-4">
                {[
                  {
                    icon: <MessageSquare className="w-4 h-4" />,
                    title: 'SMS Reminder',
                    time: '1 hour after abandonment',
                    message: '"Hi Sarah! Your spots for Connor and Emma are still saved. Tap here to complete registration."',
                    status: recoveryStep >= 1 ? 'sent' : 'pending'
                  },
                  {
                    icon: <Mail className="w-4 h-4" />,
                    title: 'Email with Incentive',
                    time: '4 hours after abandonment',
                    message: 'Personalized email with class details and "Complete today for $10 off" offer.',
                    status: recoveryStep >= 2 ? 'sent' : 'pending'
                  },
                  {
                    icon: <MessageSquare className="w-4 h-4" />,
                    title: 'Final Urgency SMS',
                    time: '24 hours after abandonment',
                    message: '"Only 2 spots left in Saturday Mini Soccer! Complete Connor\'s registration before it fills up."',
                    status: recoveryStep >= 3 ? 'sent' : 'pending'
                  }
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      step.status === 'sent'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {step.icon}
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-900">{step.title}</h5>
                          <p className="text-xs text-slate-500">{step.time}</p>
                        </div>
                      </div>
                      {step.status === 'sent' ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Sent
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 ml-10">{step.message}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={simulateRecovery}
                disabled={recoveryStep >= 3}
                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {recoveryStep >= 3 ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Recovery Sequence Complete
                  </>
                ) : (
                  <>
                    Simulate Next Step
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {recoveryStep >= 3 && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Cart recovered! Sarah completed registration after Email #2.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { label: 'Recovery Rate', value: '35%', desc: 'of abandoned carts' },
              { label: 'Revenue Recovered', value: '$12,450', desc: 'this month' },
              { label: 'Avg Response Time', value: '4.2 hrs', desc: 'to complete' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'success' && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-600 mb-6">
            Connor and Emma are registered. Confirmation emails have been sent with calendar invites.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Amount Paid</span>
              <span className="font-bold text-slate-900">${totalPrice - 20}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Discount Applied</span>
              <span className="font-medium text-emerald-600">-$20 (Sibling)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600">Confirmation #</span>
              <span className="font-mono text-slate-900">KAI-2025-8847</span>
            </div>
          </div>
          <button
            onClick={() => { setView('checkout'); setSelectedPlan(null); }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Back to Demo
          </button>
        </div>
      )}
    </div>
  );
}
