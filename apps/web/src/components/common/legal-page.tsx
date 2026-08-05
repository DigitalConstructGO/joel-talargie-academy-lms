export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated: {updatedAt}</p>
      </div>
      <p className="text-sm text-muted-foreground">{intro}</p>
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
