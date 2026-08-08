export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative flex flex-col gap-8 border-l border-border pl-6 sm:pl-8">
      {entries.map((entry) => (
        <li key={entry.year} className="relative">
          <span className="absolute -left-[calc(1.5rem+5px)] top-1 size-2.5 rounded-full bg-brand sm:-left-[calc(2rem+5px)]" />
          <p className="text-sm font-semibold text-brand">{entry.year}</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{entry.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
        </li>
      ))}
    </ol>
  );
}
