// useFilter - Custom hook for filter management
import { useState } from 'react';
import { Filter } from '../domain/Filter.js';

export function useFilter() {
  const [filter, setFilter] = useState(Filter.createDefault());

  function updateFilter(updates) {
    const updated = filter.update(updates);
    setFilter(updated);
  }

  function resetFilter() {
    setFilter(Filter.createDefault());
  }

  return {
    filter,
    updateFilter,
    resetFilter
  };
}

