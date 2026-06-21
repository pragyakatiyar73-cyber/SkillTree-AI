import React from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  initials: string;
  name: string;
  college: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    initials: 'AR',
    name: 'Anya Reddy',
    college: 'IIT Bombay',
    text: 'SkillTree AI transformed my career planning. The AI-generated roadmap was exactly what I needed. Got placed at Microsoft in my final year!'
  },
  {
    initials: 'RK',
    name: 'Rohit Kumar',
    college: 'BITS Pilani',
    text: 'The mock interview feature helped me crack technical interviews. The feedback was incredibly detailed and actionable. Highly recommend!'
  },
  {
    initials: 'PS',
    name: 'Priya Sharma',
    college: 'NIT Bangalore',
    text: 'I used SkillTree for resume building and project guidance. Got offers from Google and Amazon. This platform is a game-changer for students.'
  }
];

export default function TestimonialsSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-surface-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10">
            <p className="text-sm font-medium text-primary-400">Testimonials</p>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">Trusted by Students</span>
            {' '}
            <span className="text-white">Everywhere</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Join thousands of students who have achieved their career goals with SkillTree AI.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-primary-500/50 transition-all duration-300 hover:bg-white/10 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="fill-primary-400 text-primary-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-300 leading-relaxed mb-6 flex-grow">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.college}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
