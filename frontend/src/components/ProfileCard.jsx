export default function ProfileCard({ profile }) {
  return (
    <div className="border rounded-xl p-4 flex gap-4 items-center">
      <img
        src={profile.imageUrl}
        alt={profile.username}
        className="w-20 h-20 rounded-full object-cover"
      />

      <div>
        <div className="font-bold text-lg">
          @{profile.username}
        </div>

        <div className="flex gap-2 mt-2 flex-wrap">
          {profile.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-200 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}