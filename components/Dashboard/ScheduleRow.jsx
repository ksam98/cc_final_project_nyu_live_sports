export default function ScheduleRow({ match, isAdmin, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-nyu-neutral-50">
      {/* Match Info */}
      <div>
        <p className="font-medium text-nyu-neutral-800">{match.teams}</p>
        <p className="text-sm text-nyu-neutral-500">
          {match.time} • {match.location} • {match.sport}
        </p>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="text-sm text-nyu-primary-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
