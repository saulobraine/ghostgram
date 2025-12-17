// useFilter - Custom hook for filter management
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing useFilter');
}

const { useState } = window.React;
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

