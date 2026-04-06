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
          <h3 className="text-lg font-semibold text-gray-700">No applications match your filters</h3>
          <p className="text-gray-500 mt-1 text-sm">Try adjusting your search or filter criteria.</p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-700">No applications yet</h3>
          <p className="text-gray-500 mt-1 text-sm">Start tracking your job search by adding your first application.</p>
          <button
            onClick={onAdd}
            className="mt-5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Application
          </button>
        </>
      )}
    </div>
  )
}
