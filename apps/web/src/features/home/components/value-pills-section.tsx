import { Award, Clock, Users } from 'lucide-react';

const VALUES = [
  {
    icon: Clock,
    title: 'Self-Paced Learning',
    description: 'Study on your own schedule with lifetime access to every course you enroll in.',
  },
  {
    icon: Users,
    title: 'Real Instructors',
    description: 'Courses taught by working professionals, not narrators reading slides.',
  },
  {
    icon: Award,
    title: 'Verified Certificates',
    description: 'Finish a certificate-eligible course and show what you learned to employers.',
  },
];

export function ValuePillsSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {VALUES.map((value) => (
          <div key={value.title} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <value.icon className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{value.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{value.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
