'use client';

import { LayoutGrid, List, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchBar } from '@/components/common/search-bar';
import { useFilterStore } from '@/stores';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useCategories } from '../hooks/use-categories';
import {
  DEFAULT_CATALOG_FILTERS,
  DEFAULT_PAGE_SIZE,
  DIFFICULTY_LABELS,
  SORT_LABELS,
  type CatalogFilters,
} from '../constants/catalog.constants';

import { useLanguage } from '@/lib/i18n/language-provider';

const ALL_VALUE = 'all';

export function CourseFilters() {
  const { t } = useLanguage();
  const { data } = useCategories({ pageSize: 100 });
  const { filters, setFilter, resetFilters } = useQueryFilters<CatalogFilters>({
    defaults: DEFAULT_CATALOG_FILTERS,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { search, categoryId, accessType, difficulty, sort } = filters;
  const view = useFilterStore((state) => state.view);
  const setView = useFilterStore((state) => state.setView);

  const hasActiveFilters = Boolean(
    search || categoryId || accessType || difficulty || sort !== 'newest',
  );

  const getSortLabel = (key: string) => {
    switch (key) {
      case 'newest':
        return t('catalog.newest');
      case 'oldest':
        return t('catalog.oldest');
      case 'title_asc':
        return t('catalog.titleAsc');
      case 'title_desc':
        return t('catalog.titleDesc');
      case 'price_asc':
        return t('catalog.priceAsc');
      case 'price_desc':
        return t('catalog.priceDesc');
      case 'featured':
        return t('catalog.featured');
      default:
        return SORT_LABELS[key as keyof typeof SORT_LABELS] ?? key;
    }
  };

  const getDifficultyLabel = (key: string) => {
    switch (key) {
      case 'BEGINNER':
        return t('common.beginner');
      case 'INTERMEDIATE':
        return t('common.intermediate');
      case 'ADVANCED':
        return t('common.advanced');
      case 'ALL_LEVELS':
        return t('common.allLevels');
      default:
        return DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS] ?? key;
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <SearchBar
        placeholder={t('catalog.searchPlaceholder')}
        defaultValue={search ?? ''}
        onSearch={(value) => setFilter('search', value || undefined)}
        aria-label="Search courses"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoryId ?? ALL_VALUE}
          onValueChange={(value) =>
            setFilter('categoryId', value === ALL_VALUE ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('catalog.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t('catalog.allCategories')}</SelectItem>
            {data?.items.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={accessType ?? ALL_VALUE}
          onValueChange={(value) =>
            setFilter('accessType', value === ALL_VALUE ? undefined : value)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('catalog.access')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t('catalog.allAccess')}</SelectItem>
            <SelectItem value="FREE">{t('common.free')}</SelectItem>
            <SelectItem value="PAID">{t('common.paid')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={difficulty ?? ALL_VALUE}
          onValueChange={(value) =>
            setFilter('difficulty', value === ALL_VALUE ? undefined : value)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('catalog.level')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t('catalog.allLevels')}</SelectItem>
            {Object.keys(DIFFICULTY_LABELS).map((value) => (
              <SelectItem key={value} value={value}>
                {getDifficultyLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort ?? 'newest'} onValueChange={(value) => setFilter('sort', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('catalog.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(SORT_LABELS).map((value) => (
              <SelectItem key={value} value={value}>
                {getSortLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="size-3.5" />
            {t('catalog.reset')}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button
            type="button"
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
