import {
  SearchInput,
  Select,
  SelectOption,
  SelectVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarItemVariant,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { debounce, omit } from 'lodash-es';
import * as React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { parseFiltersFromURL, setFiltersToURL } from '../../utils/url-sync';
import type { VirtualizedTableProps } from '../table/VirtualizedTable';
import VirtualizedTable from '../table/VirtualizedTable';
import FilterChips from './FilterChips';
import './list-view.css';

export type FilterItem = {
  /** Label of a parameter used for filtering. */
  label: string;
  /** Column name for given filtering parameter. */
  id: string;
};

export type ListViewProps<D> = VirtualizedTableProps<D> & {
  /** Optional custom onFilter callback. */
  onFilter?: (filterValues: Record<string, string[]>, activeFilter?: FilterItem) => D[];
  /** Optional array of filterBy options. */
  filters?: FilterItem[];
};

export function filterDefault<D extends Record<string, unknown>>(
  data: D[],
  filterValues: Record<string, string[]>,
): D[] {
  return data.filter((item) =>
    Object.entries(filterValues).every(
      ([key, values]) =>
        typeof item[key] === 'string' &&
        values.every((v) => (item[key] as string).toLowerCase().includes(v)),
    ),
  );
}

const ListView: React.FC<ListViewProps<Record<string, unknown>>> = ({
  columns,
  data,
  filters = [],
  isRowSelected,
  onSelect,
  onFilter,
  loadError,
  loaded,
  rowActions,
  Row,
  CustomEmptyState,
  emptyStateDescription,
  loadErrorDefaultText,
  CustomNoDataEmptyState,
  'aria-label': ariaLabel,
}) => {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = React.useState<FilterItem | undefined>(filters?.[0]);
  const [filteredData, setFilteredData] = React.useState(data);
  const [isFilterSelectExpanded, setFilterSelectExpanded] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [useURL, setUseURL] = React.useState(true);
  const filterValues = React.useRef<Record<string, string[]>>({});
  const inputValue = React.useRef<string>('');

  React.useEffect(() => {
    if (useURL) {
      filterValues.current = parseFiltersFromURL(
        new URLSearchParams(location.search),
        filters.map((filter) => filter.id),
      );
    }
    if (filters) {
      setFilteredData(
        onFilter
          ? onFilter(filterValues.current, activeFilter)
          : filterDefault([...data], filterValues.current),
      );
    }
  }, [location, activeFilter, data, filters, onFilter, useURL]);

  React.useEffect(() => {
    inputValue.current = activeFilter ? filterValues.current[activeFilter.id]?.[0] : '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedChangeFilters = debounce(() => {
    if (activeFilter) {
      setFiltersToURL(
        searchParams,
        setSearchParams,
        filters.map((filter) => filter.id),
        inputValue.current?.length > 0
          ? { ...filterValues.current, [activeFilter.id]: [inputValue.current] }
          : omit(filterValues.current, activeFilter.id),
      );
    }

    setUseURL(true);
  }, 2000);

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          {filters ? (
            <>
              {filters.length > 1 && (
                <ToolbarItem key="filter-select">
                  <Select
                    toggleIcon={<FilterIcon />}
                    variant={SelectVariant.single}
                    onToggle={(value) => setFilterSelectExpanded(value)}
                    onSelect={(e, selection) => {
                      setActiveFilter(filters.find((item) => item.id === selection));
                      setFilterSelectExpanded(false);
                      inputValue.current = activeFilter
                        ? filterValues.current[selection as string]?.[0]
                        : '';
                    }}
                    placeholderText={activeFilter?.label}
                    isOpen={isFilterSelectExpanded}
                  >
                    {filters.map((option) => (
                      <SelectOption key={option.id} value={option.id}>
                        {option.label}
                      </SelectOption>
                    ))}
                  </Select>
                </ToolbarItem>
              )}
              <ToolbarItem variant={ToolbarItemVariant['search-filter']} key="search-filter">
                <SearchInput
                  className="dps-list-view__search"
                  onChange={(value) => {
                    if (useURL) {
                      setUseURL(false);
                    }
                    inputValue.current = value;
                    debouncedChangeFilters();
                  }}
                  value={inputValue.current}
                  placeholder={activeFilter?.label ? `Search by ${activeFilter.label}` : 'Search'}
                />
              </ToolbarItem>
            </>
          ) : null}
        </ToolbarContent>
        {Object.keys(filterValues.current)?.length > 0 && (
          <ToolbarContent className="dps-list-view__filters">
            <ToolbarItem>
              <FilterChips
                filters={filters}
                filterValues={filterValues.current}
                onDelete={(key) => {
                  setFiltersToURL(
                    searchParams,
                    setSearchParams,
                    filters.map((filter) => filter.id),
                    key ? omit(filterValues.current, key) : {},
                  );
                  if (activeFilter?.id === key || !key) {
                    inputValue.current = '';
                  }
                }}
              />
            </ToolbarItem>
          </ToolbarContent>
        )}
      </Toolbar>
      <VirtualizedTable
        aria-label={ariaLabel}
        areFiltersApplied={Object.values(filterValues.current).some((value) => value?.length > 0)}
        data={filters ? filteredData : data}
        loaded={loaded}
        columns={columns}
        isRowSelected={isRowSelected}
        onSelect={onSelect}
        rowActions={rowActions}
        Row={Row}
        emptyStateDescription={emptyStateDescription}
        CustomEmptyState={CustomEmptyState}
        loadError={loadError}
        loadErrorDefaultText={loadErrorDefaultText}
        CustomNoDataEmptyState={CustomNoDataEmptyState}
      />
    </>
  );
};

export default ListView;
