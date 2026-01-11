import React from "react";
import { CheckIcon, XMarkIcon, FireIcon } from "@heroicons/react/24/solid";

interface PricingSectionProps {
  onSelectPlan: (credits: number, planName: string) => void;
  onClose: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, onClose }) => {
  const commonFeatures = [
    { text: "Visual Verification Engine", included: true },
    { text: "Global Supplier Search", included: true },
    { text: "Profit & Risk Calculator", included: true },
  ];

  // TODO: PASTE YOUR STRIPE PAYMENT LINKS HERE
  // Go to Stripe Dashboard -> Payment Links -> Create New
  // Set "After payment" to redirect to: https://your-site.com/?success=true&plan=PLAN_NAME
  const STRIPE_LINKS = {
    hustler: "", // e.g. "https://buy.stripe.com/..."
    manager: "", // e.g. "https://buy.stripe.com/..."
    owner: ""    // e.g. "https://buy.stripe.com/..."
  };

  const plans = [
    {
      name: "Free Trial",
      id: "free",
      price: "$0",
      period: "one-time",
      credits: 3,
      description: "Test the waters.",
      features: [
        ...commonFeatures,
        { text: "AI Chatbot Assistant", included: false },
      ],
      isPopular: false,
      buttonText: "Try for Free",
      paymentLink: "" // Free plan has no link
    },
    {
      name: "The Hustler",
      id: "hustler",
      price: "$4.99",
      period: "month",
      credits: 50,
      description: "For side hustlers.",
      features: [
        ...commonFeatures,
        { text: "AI Chatbot Assistant", included: true },
      ],
      isPopular: true,
      buttonText: "Start Hustling",
      paymentLink: STRIPE_LINKS.hustler
    },
    {
      name: "The Manager",
      id: "manager",
      price: "$9.99",
      period: "month",
      credits: 150,
      description: "For growing stores.",
      features: [
        ...commonFeatures,
        { text: "AI Chatbot Assistant", included: true },
      ],
      isPopular: false,
      buttonText: "Upgrade",
      paymentLink: STRIPE_LINKS.manager
    },
    {
      name: "The Owner",
      id: "owner",
      price: "$23.99",
      period: "month",
      credits: 400,
      description: "For scaling operations.",
      features: [
        ...commonFeatures,
        { text: "AI Chatbot Assistant", included: true },
      ],
      isPopular: false,
      buttonText: "Scale Up",
      paymentLink: STRIPE_LINKS.owner
    }
  ];

  const handleSubscribe = (plan: typeof plans[0]) => {
    if (plan.paymentLink) {
      // Production Mode: Redirect to Stripe
      window.location.href = plan.paymentLink;
    } else {
      // Demo/Dev Mode: Update state immediately
      onSelectPlan(plan.credits, plan.name);
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen py-12 animate-fade-in text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-slate-500 hover:text-[#00F0FF] mb-6"
          >
            ← Back to Search
          </button>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Simple, Volume-Based Pricing.
          </h2>
          <p className="text-lg text-slate-400">
            Every paid plan gets <span className="text-[#00F0FF] font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">Full Access</span> to all features. 
            <br />
            Just choose how many searches you need.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-2 ${
                plan.isPopular 
                  ? "bg-[#121212] border-2 border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.15)] scale-105 z-10" 
                  : plan.name === "Free Trial"
                    ? "bg-[#0a0a0a] border border-white/5 opacity-80 hover:opacity-100"
                    : "bg-[#121212] border border-white/10 shadow-lg"
              }`}
            >
              {/* Badge for Popular */}
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-[#00F0FF] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-[0_0_10px_rgba(0,240,255,0.5)] uppercase tracking-wide">
                    <FireIcon className="w-3 h-3 mr-1 text-black" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-1 ${plan.name === "Free Trial" ? "text-slate-500" : "text-white"}`}>
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4 h-4">{plan.description}</p>
                
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  {plan.price !== "$0" && <span className="text-sm text-slate-500 ml-1">/{plan.period}</span>}
                </div>
              </div>

              {/* Credits Highlight */}
              <div className={`mb-8 p-4 rounded-xl text-center ${
                plan.isPopular ? "bg-cyan-950/20 border border-[#00F0FF]/30" : "bg-[#1a1a1a] border border-white/5"
              }`}>
                <span className={`block text-2xl font-black ${
                  plan.isPopular ? "text-[#00F0FF]" : "text-slate-300"
                }`}>
                  {plan.credits}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Searches / {plan.period}</span>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    {feature.included ? (
                      <CheckIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        plan.isPopular ? "text-[#00F0FF]" : "text-emerald-500"
                      }`} />
                    ) : (
                      <XMarkIcon className="w-5 h-5 mr-3 flex-shrink-0 text-slate-700" />
                    )}
                    <span className={`${
                      feature.included ? "text-slate-300 font-medium" : "text-slate-600 line-through"
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                  plan.isPopular
                    ? "bg-[#00F0FF] text-black hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    : plan.name === "Free Trial"
                      ? "bg-[#1a1a1a] text-slate-400 hover:bg-[#222]"
                      : "bg-white text-black hover:bg-slate-200"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-16 text-center">
            <p className="text-sm text-slate-500">
                Secure payment processed by Stripe. Cancel anytime. 
            </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;