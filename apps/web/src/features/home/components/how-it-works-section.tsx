const STEPS = [
  { title: 'Create an account', description: 'Sign up free in under a minute.' },
  { title: 'Find a course', description: 'Browse the catalog or search for a topic.' },
  { title: 'Start learning', description: 'Work through lessons at your own pace.' },
  { title: 'Get certified', description: 'Finish the course and earn your certificate.' },
];

export function HowItWorksSection() {
  return (
    <section className="bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The Learning Framework
          </h2>
          <p className="mt-2 text-sm text-slate-400">Four simple steps to start learning.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex flex-col gap-3 border-t-2 border-lime-400 pt-4">
              <span className="text-3xl font-bold text-lime-400">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-sm font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
