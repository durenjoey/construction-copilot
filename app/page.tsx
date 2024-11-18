import { HardHat, FileText, ClipboardCheck, Brain, Star, MessageSquare, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const roadmapItems = [
    {
      date: "December 2024",
      feature: "Daily Reports",
      description: "Automated daily reporting and progress tracking"
    },
    {
      date: "January 2025",
      feature: "Smart Meeting Minutes",
      description: "AI-powered meeting documentation and action item tracking"
    },
    {
      date: "February 2025",
      feature: "Financial Control Suite",
      description: "Budget Management + Earned Value Analysis"
    },
    {
      date: "March 2025",
      feature: "Kanban Project Tracking",
      description: "Visual project management with automated updates"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-white overflow-hidden">
      {/* Auth Navigation */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
        <Link href="/auth/signin">
          <Button variant="ghost" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signin">
          <Button className="bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Register
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Geometric pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(249 115 22 / 0.15) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 pt-16 pb-16">
          {/* Beta Badge with CTA */}
          <div className="flex flex-col items-center gap-4 mb-12">
            <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-full border border-orange-500/20">
              Beta Access Now Available
            </span>
            <Link href="/auth/signin">
              <Button className="bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                Join Here
              </Button>
            </Link>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HardHat className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl font-bold">Construction Copilot</h1>
            </div>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Creating a world where builders build, and AI handles the rest.
            </p>
          </div>

          {/* Beta Features Section */}
          <div className="text-center mb-6">
            <span className="px-4 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-full">
              Beta Features
            </span>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <FileText className="w-5 h-5" />,
                title: "Construction Scope Creator",
                description: "From hours to minutes: AI-driven scope creation that incorporates industry best practices and ensures consistency."
              },
              {
                icon: <ClipboardCheck className="w-5 h-5" />,
                title: "Proposal Reviewer",
                description: "Never miss a detail: AI-powered proposal analysis that flags discrepancies, identifies risks, and ensures perfect alignment."
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: "Lessons Learned Repository",
                description: "Your institutional knowledge, preserved: AI organizes and categorizes project insights for future success."
              }
            ].map((feature, index) => (
              <div key={index} 
                className="p-5 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Roadmap Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Aggressive Shipping Timeline</h3>
              <p className="text-neutral-600 dark:text-neutral-400">New features dropping monthly</p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              {roadmapItems.map((item, index) => (
                <div key={index} className="relative pb-12 last:pb-0">
                  {/* Timeline line */}
                  {index !== roadmapItems.length - 1 && (
                    <div className="absolute left-[21px] top-10 bottom-0 w-px bg-orange-500/20"></div>
                  )}
                  
                  {/* Timeline item */}
                  <div className="flex items-start gap-6">
                    {/* Dot */}
                    <div className="w-11 h-11 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 flex-1">
                      <div className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">{item.date}</div>
                      <h4 className="font-semibold mb-1">{item.feature}</h4>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Future hint */}
              <div className="mt-8 text-center">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm">
                  More features in development. Stay tuned.
                </span>
              </div>
            </div>
          </div>

          {/* GPT Success Story */}
          <div className="bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Our Origin Story</h3>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Born from 10,000+ conversations through our custom GPT - the original Construction Copilot.
                The revelation was clear: the world was ready for AI Construction PMs.
              </p>
            </div>
            <div className="flex justify-center gap-8">
              {[
                { icon: <MessageSquare className="w-4 h-4" />, stat: "10,000+", label: "Conversations" },
                { icon: <Star className="w-4 h-4" />, stat: "4.4/5", label: "Star Rating" },
                { icon: <ClipboardCheck className="w-4 h-4" />, stat: "200+", label: "Reviews" }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center space-x-2 text-orange-500 mb-2">
                    {item.icon}
                    <span className="font-bold text-xl">{item.stat}</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Link href="/auth/signin">
              <Button className="px-8 py-4 bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                Join the Beta
              </Button>
            </Link>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              Limited spots available for early access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
