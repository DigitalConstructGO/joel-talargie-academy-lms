import { Search, UserPlus, PlayCircle, Award } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Create an account', description: 'Sign up free in under a minute.' },
  {
    icon: Search,
    title: 'Find a course',
    description: 'Browse the catalog or search for a topic.',
  },
  {
    icon: PlayCircle,
    title: 'Start learning',
    description: 'Work through lessons at your own pace.',
  },
  {
    icon: Award,
    title: 'Get certified',
    description: 'Finish the course and earn your certificate.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">How it works</h2>
          <p className="mt-1 text-sm text-muted-foreground">Four simple steps to start learning.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex flex-col items-center gap-3 text-center">
              <div className="relative flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                <step.icon className="size-6" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                  {index + 1}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
