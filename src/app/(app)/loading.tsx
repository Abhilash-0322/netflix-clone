export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse px-4 pt-24 md:px-12 md:pt-28">
      <div className="h-8 w-40 rounded bg-neutral-800" />
      <div className="mt-3 h-4 w-64 rounded bg-neutral-900" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[2/3] rounded-md bg-neutral-900"
          />
        ))}
      </div>
    </div>
  );
}
