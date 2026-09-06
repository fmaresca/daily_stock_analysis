import React from 'react';
import { ArrowUpDown } from '../icons';
import { SortOrder } from '../../utils/tableSort';

export interface SortableThProps {
  label?: React.ReactNode;
  sortKey?: string;
  columnKey?: string;
  currentSortKey?: string | null;
  sortOrder?: SortOrder;
  currentSortOrder?: SortOrder;
  onSort?: (key: string) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
  children?: React.ReactNode;
  title?: string;
}

export const SortableTh: React.FC<SortableThProps> = ({
  label,
  sortKey: propSortKey,
  columnKey,
  currentSortKey,
  sortOrder,
  currentSortOrder,
  onSort,
  align = 'left',
  className = '',
  children,
  title,
}) => {
  const activeKey = propSortKey || columnKey;
  const activeSortKey = currentSortKey;
  const activeSortOrder = currentSortOrder || sortOrder || 'asc';
  const isSortable = Boolean(activeKey && onSort);
  const isActive = isSortable && activeSortKey === activeKey;

  const alignClass =
    align === 'right'
      ? 'text-right justify-end'
      : align === 'center'
      ? 'text-center justify-center'
      : 'text-left justify-start';

  return (
    <th
      onClick={() => isSortable && activeKey && onSort?.(activeKey)}
      title={title || (isSortable ? `Click to sort by ${typeof label === 'string' ? label : 'this column'}` : undefined)}
      className={`sticky top-0 z-20 bg-slate-900/98 backdrop-blur py-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800 transition-colors shadow-xs ${
        isSortable ? 'cursor-pointer hover:text-slate-100 hover:bg-slate-800/80' : ''
      } ${className}`}
    >
      <div className={`flex items-center space-x-1.5 ${alignClass}`}>
        <span>{label || children}</span>
        {isSortable && (
          <span className="inline-flex items-center shrink-0">
            {isActive ? (
              <span className="text-emerald-400 font-extrabold text-xs">
                {activeSortOrder === 'asc' ? '▲' : '▼'}
              </span>
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-40 hover:opacity-80" />
            )}
          </span>
        )}
      </div>
    </th>
  );
};
