import { useState, type FormEvent } from 'react';
import './ItemSearchBar.css';

interface ItemSearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export default function ItemSearchBar({ initialQuery = '', onSearch }: ItemSearchBarProps) {
  const [value, setValue] = useState(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form className="item-search-bar" role="search" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="item-search-input">
        Search found items
      </label>
      <input
        id="item-search-input"
        className="form-control item-search-bar__input"
        type="search"
        placeholder="Search by keyword, e.g. black wallet…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button className="btn btn-primary" type="submit">
        Search
      </button>
    </form>
  );
}
