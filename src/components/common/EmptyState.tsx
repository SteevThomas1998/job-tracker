interface Props {
  hasFilters: boolean
  onAdd: () => void
}

export default function EmptyState({ hasFilters, onAdd }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">📋</div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No applications match your filters</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Try adjusting your search or filter criteria.</p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No applications yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Start tracking your job search by adding your first application.</p>
          <button
            onClick={onAdd}
            className="mt-5 px-4 py-2 text-white text-sm font-semibold rounded-lg active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
          >
            Add Application
          </button>
        </>
      )}
    </div>
  )
}
