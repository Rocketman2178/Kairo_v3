import { useNavigate } from 'react-router-dom';
import {
  Trophy, Users, Calendar, Star, MapPin, Shield, Heart,
  Clock, ChevronRight, Mail, Phone, ArrowRight, Zap
} from 'lucide-react';

const programs = [
  {
    name: 'Mini Soccer',
    ages: '2-3',
    description: 'Introduction to soccer through creative play and motor skill development',
    price: '$180/season',
    color: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    name: 'Classic Soccer',
    ages: '3-5',
    description: 'Building foundational skills with fun games and positive coaching',
    price: '$195/season',
    color: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  {
    name: 'Premier Soccer',
    ages: '5-8',
    description: 'Advanced skill development with team play and friendly competition',
    price: '$210/season',
    color: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  {
    name: 'Summer Camp',
    ages: '4-8',
    description: 'Week-long intensive soccer camp with daily activities and games',
    price: '$275/week',
    color: 'from-rose-500 to-rose-600',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Expert Coaches',
    description: 'Trained, background-checked coaches who make learning fun',
  },
  {
    icon: Heart,
    title: 'Character Building',
    description: 'We emphasize teamwork, respect, and sportsmanship',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Morning, afternoon, and weekend options available',
  },
];

export function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-emerald-600/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-8">
              <Trophy className="w-4 h-4" />
              Soccer Shots Orange County
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              The #1 Youth Soccer Experience{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                for Ages 2-8
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Fun, engaging soccer programs that build character and confidence
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/demo')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-lg"
              >
                Register Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#programs"
                className="w-full sm:w-auto px-8 py-4 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 hover:border-slate-500 transition-all flex items-center justify-center gap-2 text-lg"
              >
                View Programs
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Programs</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Age-appropriate programs designed to grow with your child
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {programs.map((program) => (
            <div
              key={program.name}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${program.iconBg} flex items-center justify-center`}>
                  <Zap className={`w-6 h-6 ${program.iconColor}`} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${program.badge}`}>
                  Ages {program.ages}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{program.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">{program.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <span className="text-lg font-bold text-white">{program.price}</span>
                <button
                  onClick={() => navigate('/demo')}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Learn More
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              More than soccer -- we're building the next generation of great humans
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center"
              >
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <feature.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-4">
            <Star className="w-5 h-5 fill-amber-400" />
            <Star className="w-5 h-5 fill-amber-400" />
            <Star className="w-5 h-5 fill-amber-400" />
            <Star className="w-5 h-5 fill-amber-400" />
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Trusted by 500+ families in Orange County
          </h2>
          <p className="text-slate-400 text-lg">
            Join the community that's making youth sports better
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">12 Locations</span>
          </div>
          <div className="w-px h-6 bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">50+ Coaches</span>
          </div>
          <div className="w-px h-6 bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 text-slate-300">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="font-semibold">4.9 Rating</span>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
            Register in minutes with our AI-powered assistant. Find the perfect program for your child today.
          </p>
          <button
            onClick={() => navigate('/demo')}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-lg mx-auto"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <h3 className="font-bold text-white text-lg mb-3">Soccer Shots Orange County</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  info@soccershots-oc.com
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (949) 555-0123
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <p className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">About</p>
                <p className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">Programs</p>
                <p className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">FAQ</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <p
                  onClick={() => navigate('/privacy')}
                  className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors"
                >
                  Privacy Policy
                </p>
                <p
                  onClick={() => navigate('/terms')}
                  className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors"
                >
                  Terms & Conditions
                </p>
                <p className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">Contact</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            Powered by Kairo
          </div>
        </div>
      </footer>
    </div>
  );
}
