'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SearchBar } from '@/components/common/search-bar';
import { EmptyState } from '@/components/common/empty-state';
import { SearchX } from 'lucide-react';
import { HELP_CATEGORIES } from '../data/help-articles.data';

export function HelpCenterContent() {
  const [query, setQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return HELP_CATEGORIES;
    const needle = query.toLowerCase();
    return HELP_CATEGORIES.map((category) => ({
      ...category,
      articles: category.articles.filter(
        (article) =>
          article.question.toLowerCase().includes(needle) ||
          article.answer.toLowerCase().includes(needle),
      ),
    })).filter((category) => category.articles.length > 0);
  }, [query]);

  return (
    <div className="flex flex-col gap-8">
      <SearchBar
        placeholder="Search help articles…"
        onSearch={setQuery}
        aria-label="Search help articles"
        className="mx-auto w-full max-w-lg"
      />

      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No help articles found"
          description="Try a different search term."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredCategories.map((category) => (
            <div key={category.title} className="rounded-xl border border-border p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <category.icon className="size-4" />
                </span>
                <h2 className="text-base font-semibold text-foreground">{category.title}</h2>
              </div>
              <Accordion type="single" collapsible>
                {category.articles.map((article, index) => (
                  <AccordionItem key={index} value={`${category.title}-${index}`}>
                    <AccordionTrigger className="text-sm">{article.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {article.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
