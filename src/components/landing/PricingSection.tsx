import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface PricingTier {
  name: string;
  price: number | null;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: null,
    description: 'Perfect for getting started with your career journey.',
    features: [
      'AI Career Assessment',
      'Basic Roadmap Generation',
      '1 Resume Template',
      'Access to Learning Resources',
      'Community Forum Access',
      'Limited Mock Interview'
    ],
    cta: 'Get Started'
  },
  {
    name: 'Pro',
    price: 299,
    period: '/month',
    description: 'Build your career with comprehensive tools and guidance.',
    features: [
      'Everything in Free',
      'Advanced Roadmap Personalization',
      'Unlimited Resume Variants',
      'Project Generator (10/month)',
      'Unlimited Mock Interviews',
      'Interview Feedback & Analytics',
      'Placement Prep Course',
      'Priority Support'
    ],
    cta: 'Start Pro Trial',
    highlighted: true
  },
  {
    name: 'Premium',
    price: 599,
    period: '/month',
    description: 'Maximize your chances with 1-on-1 mentoring and advanced features.',
    features: [
      'Everything in Pro',
      'Unlimited Project Generator',
      '1-on-1 Career Mentoring (4/month)',
      'Resume Review by Experts',
      'Company-Specific Interview Prep',
      'Salary Negotiation Guide',
      'LinkedIn Optimization',
      '24/7 Priority Support'
    ],
    cta: 'Start Premium Trial'
  }
];

export default function PricingSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-surface-950">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10">
            <p className="text-sm font-medium text-primary-400">Pricing</p>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">Simple, Transparent</span>
            {' '}
            <span className="text-white">Pricing</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Choose the plan that works for your career goals. All plans come with a 14-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl transition-all duration-300 ${
                tier.highlighted
                  ? 'bg-gradient-to-br from-primary-500/20 to-transparent border border-primary-500/50 shadow-lg shadow-primary-500/20 md:scale-105'
                  : 'bg-white/5 backdrop-blur border border-white/10 hover:border-primary-500/50 hover:bg-white/10'
              }`}
            >
              {/* Highlighted Badge */}
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-block px-4 py-1 rounded-full bg-primary-500 text-white text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier Info */}
              <h3 className="text-2xl font-bold text-white mb-2">
                {tier.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {tier.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {tier.price === null ? 'Free' : `$${tier.price}`}
                  </span>
                  {tier.period && (
                    <span className="text-gray-400">{tier.period}</span>
                  )}
                </div>
                {tier.price !== null && (
                  <p className="text-sm text-gray-500 mt-2">Billed monthly. First 14 days free.</p>
                )}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 mb-8 flex items-center justify-center gap-2 ${
                  tier.highlighted
                    ? 'btn-primary hover:gap-3'
                    : 'btn-secondary hover:bg-white/10'
                }`}
              >
                {tier.cta}
                <ArrowRight size={18} />
              </button>

              {/* Features List */}
              <div className="space-y-4">
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check
                      size={20}
                      className="text-primary-400 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-gray-300 text-sm">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Hint */}
        <div className="text-center mt-16 pt-12 border-t border-white/5">
          <p className="text-gray-400">
            Questions about plans?{' '}
            <a href="#contact" className="text-primary-400 hover:text-primary-300 transition-colors">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
