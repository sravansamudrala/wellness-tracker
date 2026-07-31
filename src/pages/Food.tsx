import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { SkeletonCard } from "../components/Skeleton";
import {
  analyzePhoto,
  createEntry,
  deleteEntry,
  getToday,
} from "../services/foodApi";
import type { FoodEntry } from "../services/foodApi";

interface ReviewItem {
  include: boolean;
  name: string;
  quantity: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
}

type ReviewField = "name" | "quantity" | "calories" | "protein_g" | "carbs_g" | "fat_g";

function Food() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [nameInput, setNameInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [caloriesInput, setCaloriesInput] = useState("");
  const [proteinInput, setProteinInput] = useState("");
  const [carbsInput, setCarbsInput] = useState("");
  const [fatInput, setFatInput] = useState("");
  const [adding, setAdding] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[] | null>(null);
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadToday() {
      try {
        const data = await getToday();
        if (cancelled) return;
        setEntries(data.entries);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadToday();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + (e.protein_g ?? 0), 0);
  const totalCarbs = entries.reduce((sum, e) => sum + (e.carbs_g ?? 0), 0);
  const totalFat = entries.reduce((sum, e) => sum + (e.fat_g ?? 0), 0);

  const handleAddEntry = async (e: SubmitEvent) => {
    e.preventDefault();

    const calories = parseInt(caloriesInput, 10);
    if (!nameInput.trim() || !quantityInput.trim() || !Number.isFinite(calories) || calories < 0) {
      setSaveError("Enter a name, quantity, and valid calories.");
      return;
    }

    setAdding(true);
    setSaveError(null);

    try {
      const entry = await createEntry({
        name: nameInput.trim(),
        quantity: quantityInput.trim(),
        calories,
        protein_g: proteinInput ? parseFloat(proteinInput) : undefined,
        carbs_g: carbsInput ? parseFloat(carbsInput) : undefined,
        fat_g: fatInput ? parseFloat(fatInput) : undefined,
      });
      setEntries((prev) => [...prev, entry]);
      setNameInput("");
      setQuantityInput("");
      setCaloriesInput("");
      setProteinInput("");
      setCarbsInput("");
      setFatInput("");
    } catch {
      setSaveError("Couldn't save that entry — check your connection and try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSaveError(null);

    try {
      await deleteEntry(id);
    } catch {
      // Roll back so the list can't silently diverge from the server.
      setEntries(previous);
      setSaveError("Couldn't delete that entry — check your connection and try again.");
    }
  };

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      const result = await analyzePhoto(file);
      if (result.items.length === 0) {
        setPhotoError("Couldn't identify any food in that photo — try a clearer shot or log manually.");
        return;
      }
      setReviewItems(
        result.items.map((item) => ({
          include: true,
          name: item.name,
          quantity: item.quantity,
          calories: String(item.calories),
          protein_g: item.protein_g != null ? String(item.protein_g) : "",
          carbs_g: item.carbs_g != null ? String(item.carbs_g) : "",
          fat_g: item.fat_g != null ? String(item.fat_g) : "",
        }))
      );
    } catch {
      setPhotoError("Couldn't analyze that photo — try again or log manually.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateReviewField = (index: number, field: ReviewField, value: string) => {
    setReviewItems((prev) =>
      prev ? prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)) : prev
    );
  };

  const toggleReviewInclude = (index: number) => {
    setReviewItems((prev) =>
      prev ? prev.map((item, i) => (i === index ? { ...item, include: !item.include } : item)) : prev
    );
  };

  const closeReview = () => setReviewItems(null);

  const saveReviewed = async () => {
    const toSave = (reviewItems ?? []).filter((item) => item.include);
    if (toSave.length === 0) {
      closeReview();
      return;
    }

    setSavingReview(true);
    setSaveError(null);

    try {
      const created = await Promise.all(
        toSave.map((item) =>
          createEntry({
            name: item.name.trim(),
            quantity: item.quantity.trim(),
            calories: parseInt(item.calories, 10) || 0,
            protein_g: item.protein_g ? parseFloat(item.protein_g) : undefined,
            carbs_g: item.carbs_g ? parseFloat(item.carbs_g) : undefined,
            fat_g: item.fat_g ? parseFloat(item.fat_g) : undefined,
          })
        )
      );
      setEntries((prev) => [...prev, ...created]);
      setReviewItems(null);
    } catch {
      setSaveError("Couldn't save those items — check your connection and try again.");
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="food-container">
      <div className="food-header-row">
        <h2>🥗 Food</h2>
        <button
          className="food-icon-btn"
          onClick={handlePhotoButtonClick}
          disabled={uploadingPhoto}
          aria-label="Scan a food photo"
        >
          {uploadingPhoto ? "⏳" : "📷"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          style={{ display: "none" }}
        />
      </div>

      {photoError && <p className="status-error">{photoError}</p>}

      {loading && (
        <>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your food log.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="progress-card">
            <h3>Today's Total</h3>
            <p className="food-total-calories">{totalCalories} kcal</p>
            <p>
              {totalProtein.toFixed(0)}g protein · {totalCarbs.toFixed(0)}g carbs ·{" "}
              {totalFat.toFixed(0)}g fat
            </p>
          </div>

          {saveError && <p className="status-error">{saveError}</p>}

          <form className="food-add-row" onSubmit={handleAddEntry}>
            <input
              type="text"
              placeholder="Food name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <input
              type="text"
              placeholder="Quantity (e.g. 1 bowl)"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
            />
            <input
              type="number"
              placeholder="Calories"
              value={caloriesInput}
              onChange={(e) => setCaloriesInput(e.target.value)}
            />
            <div className="food-macro-row">
              <input
                type="number"
                placeholder="Protein (g)"
                value={proteinInput}
                onChange={(e) => setProteinInput(e.target.value)}
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={carbsInput}
                onChange={(e) => setCarbsInput(e.target.value)}
              />
              <input
                type="number"
                placeholder="Fat (g)"
                value={fatInput}
                onChange={(e) => setFatInput(e.target.value)}
              />
            </div>
            <button type="submit" disabled={adding}>
              {adding ? "Adding…" : "＋ Add"}
            </button>
          </form>

          <h3>Today's Entries</h3>

          {entries.length === 0 && <p className="status-msg">No food logged yet today.</p>}

          <ul>
            {entries.map((entry) => (
              <li key={entry.id} className="food-entry-item">
                <div className="food-entry-info">
                  <span className="food-entry-name">{entry.name}</span>
                  <span className="food-entry-detail">
                    {entry.quantity} · {entry.calories} kcal
                  </span>
                </div>
                <button
                  className="food-icon-btn-inline"
                  onClick={() => handleDelete(entry.id)}
                  aria-label={`Delete ${entry.name}`}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {reviewItems && (
        <div className="food-modal-backdrop" onClick={closeReview}>
          <div className="food-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📷 Review Detected Items</h3>
            <p className="status-msg">AI estimates — check and edit before saving.</p>

            {reviewItems.map((item, index) => (
              <div key={index} className="food-review-item">
                <input
                  type="checkbox"
                  checked={item.include}
                  onChange={() => toggleReviewInclude(index)}
                  aria-label={`Include ${item.name || "item"}`}
                />
                <div className="food-review-fields">
                  <input
                    type="text"
                    value={item.name}
                    placeholder="Name"
                    onChange={(e) => updateReviewField(index, "name", e.target.value)}
                  />
                  <input
                    type="text"
                    value={item.quantity}
                    placeholder="Quantity"
                    onChange={(e) => updateReviewField(index, "quantity", e.target.value)}
                  />
                  <input
                    type="number"
                    value={item.calories}
                    placeholder="Calories"
                    onChange={(e) => updateReviewField(index, "calories", e.target.value)}
                  />
                  <div className="food-macro-row">
                    <input
                      type="number"
                      value={item.protein_g}
                      placeholder="Protein (g)"
                      onChange={(e) => updateReviewField(index, "protein_g", e.target.value)}
                    />
                    <input
                      type="number"
                      value={item.carbs_g}
                      placeholder="Carbs (g)"
                      onChange={(e) => updateReviewField(index, "carbs_g", e.target.value)}
                    />
                    <input
                      type="number"
                      value={item.fat_g}
                      placeholder="Fat (g)"
                      onChange={(e) => updateReviewField(index, "fat_g", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {saveError && <p className="status-error">{saveError}</p>}

            <div className="food-modal-actions">
              <button onClick={closeReview} disabled={savingReview}>
                Cancel
              </button>
              <button onClick={saveReviewed} disabled={savingReview}>
                {savingReview ? "Saving…" : "Add Selected"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Food;
