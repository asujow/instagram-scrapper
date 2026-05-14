export default function TagsPage({
  tags,
  profiles
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold">
          Tags
        </h1>

        <p className="text-zinc-500 mt-2">
          Manage your profile tags
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tags.map((tag) => {
          const count = profiles.filter((p) =>
            p.tags.includes(tag)
          ).length;

          return (
            <div
              key={tag}
              className="bg-white border rounded-2xl p-4"
            >
              <div className="font-bold">
                {tag}
              </div>

              <div className="text-zinc-500 text-sm mt-1">
                {count} profiles
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}