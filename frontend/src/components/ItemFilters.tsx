import { type FormEvent } from 'react';
import { CATEGORIES, type Category } from '../types';
import { categoryLabel } from '../lib/format';
import './ItemFilters.css';

export interface ItemFilterValues {
  category: string;
  fromDate: string;
  toDate: string;
  sort: 'newest' | 'oldest';
}

interface ItemFiltersProps {
  values: ItemFilterValues;
  onChange: (values: ItemFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
}

/** Category / date-range / sort controls (spec 11). */
export default function ItemFilters({ values, onChange, onApply, onClear }: ItemFiltersProps) {
  const set = (patch: Partial<ItemFilterValues>) => onChange({ ...values, ...patch });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form className="item-filters" onSubmit={handleSubmit}>
      <div className="item-filters__field">
        <label className="form-label" htmlFor="filter-category">
          Category
        </label>
        <select
          id="filter-category"
          className="form-control"
          value={values.category}
          onChange={(event) => set({ category: event.target.value })}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category: Category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="item-filters__field">
        <label className="form-label" htmlFor="filter-from">
          Found from
        </label>
        <input
          id="filter-from"
          className="form-control"
          type="date"
          value={values.fromDate}
          onChange={(event) => set({ fromDate: event.target.value })}
        />
      </div>

      <div className="item-filters__field">
        <label className="form-label" htmlFor="filter-to">
          Found to
        </label>
        <input
          id="filter-to"
          className="form-control"
          type="date"
          value={values.toDate}
          onChange={(event) => set({ toDate: event.target.value })}
        />
      </div>

      <div className="item-filters__field">
        <label className="form-label" htmlFor="filter-sort">
          Sort by
        </label>
        <select
          id="filter-sort"
          className="form-control"
          value={values.sort}
          onChange={(event) =>
            set({ sort: event.target.value === 'oldest' ? 'oldest' : 'newest' })
          }
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="item-filters__actions">
        <button className="btn btn-primary btn-sm" type="submit">
          Apply filters
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onClear}>
          Clear
        </button>
      </div>
    </form>
  );
}
