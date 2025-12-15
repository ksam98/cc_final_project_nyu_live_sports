import Link from 'next/link';

export default function StreamCard({ channel }) {
  return (
    <Link href={`/stream?id=${channel.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-lg transition">
        <div className="aspect-video bg-gradient-to-br from-nyu-primary-600 to-nyu-secondary-700 relative">
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <span className="font-semibold">LIVE</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg text-nyu-neutral-800">
            {channel.broadcastName}
          </h3>
          <p className="text-sm text-nyu-neutral-600">
            {new Date(channel.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
