import { type MostGeneratedProps } from "../../types";

export default function MostGenerated({
  popularCompounds,
  popularError,
  onCompoundClick,
}: MostGeneratedProps) {
  return (
    <>
      <h2 className="font-bold text-lg mb-4">Most Generated</h2>
      {popularError ? (
        <div className="alert alert-error">
          <p className="text-sm">{popularError}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {popularCompounds.map((entry, i) => (
            <div
              key={i}
              onClick={() => onCompoundClick(entry.compound)}
              data-testid="popular-compound"
              className="badge badge-outline badge-sm p-3 cursor-pointer hover:badge-primary transition-colors"
            >
              <span className="truncate max-w-[120px]" title={entry.compound}>
                {entry.compound}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
