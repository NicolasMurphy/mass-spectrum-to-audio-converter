import { useEffect, useState } from "react";
import { type CompoundSearchProps } from "../../types";

export default function CompoundSearch({
  compound,
  onCompoundChange,
}: CompoundSearchProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [compounds, setCompounds] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    fetch("/compounds.json")
      .then((res) => res.json())
      .then((data) => setCompounds(data))
      .catch((err) => console.error("Failed to load compounds:", err));
  }, []);

  useEffect(() => {
    if (selectedIndex >= 0 && showSuggestions) {
      const listElement = document.querySelector("[data-testid='suggestion-list']");
      const selectedElement = listElement?.children[
        selectedIndex
      ] as HTMLElement;

      if (selectedElement && listElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, showSuggestions]);

  const handleInputChange = (value: string) => {
    onCompoundChange(value);
    setSelectedIndex(-1);

    if (value.length > 0) {
      const filtered = compounds.filter((comp) =>
        comp.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onCompoundChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleRandomCompound = () => {
    const randomIndex = Math.floor(Math.random() * compounds.length);
    const randomCompound = compounds[randomIndex];
    onCompoundChange(randomCompound);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="form-control mb-4 relative">
      <label className="label" htmlFor="compoundInput">
        <span className="label-text font-semibold">Compound Name</span>
      </label>
      <div className="flex gap-2">
        <input
          required
          id="compoundInput"
          type="text"
          maxLength={349}
          placeholder="e.g. caffeine"
          className="input input-bordered w-full"
          value={compound}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleRandomCompound}
          disabled={compounds.length === 0}
          className="btn btn-ghost btn-square text-xl"
          title="Random compound"
          data-random-button="true"
        >
          🎲
        </button>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul
          data-testid="suggestion-list"
          className="suggestion-list absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto z-10"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
