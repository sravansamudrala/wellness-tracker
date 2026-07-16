# Learning Notes: Water Module

## React Component Mental Model

A React page component is easiest to read in this order:

```tsx
function Water() {
  // 1. state lives here
  const [today, setToday] = useState(...);
  const [loading, setLoading] = useState(...);

  // 2. helper functions live here
  const loadWaterData = async () => {
    ...
  };

  const handleAddWater = async (amountMl: number) => {
    ...
  };

  // 3. useEffect lives here
  useEffect(() => {
    loadWaterData();
  }, []);

  // 4. computed values live here
  const amountMl = today?.amount_ml ?? 0;
  const progress = Math.min(...);

  // 5. return UI lives here
  return (
    <div>
      ...
    </div>
  );
}
```

## What Each Section Means

- State is what the component remembers.
- Helper functions are what the component can do.
- `useEffect` is what the component does automatically when it opens.
- Computed values are values calculated from state.
- `return` is what the user sees.

## Water Page Examples

State:

```tsx
const [today, setToday] = useState<WaterEntry | null>(null);
const [saving, setSaving] = useState(false);
```

Helper function:

```tsx
const handleAddWater = async (amountMl: number) => {
  setSaving(true);
  setError(null);

  try {
    const updatedToday = await addWater({ amount_ml: amountMl });
    const updatedStats = await getWaterStats();

    setToday(updatedToday);
    setStats(updatedStats);
  } catch (err) {
    console.error(err);
    setError("Could not add water.");
  } finally {
    setSaving(false);
  }
};
```

Automatic load:

```tsx
useEffect(() => {
  loadWaterData();
}, []);
```

Computed values:

```tsx
const amountMl = today?.amount_ml ?? 0;
const dailyGoalMl = settings?.daily_goal_ml ?? 2000;
const progress = Math.min(Math.round((amountMl / dailyGoalMl) * 100), 100);
```

## Backend-To-Frontend Mental Model

- Backend model defines the database table.
- Backend schema defines and validates API input/output.
- Backend service contains business logic.
- Backend API route receives HTTP requests and calls the service.
- Frontend service calls backend endpoints.
- Frontend page uses the service and renders UI.

## Where The Backend Service Class Is Used

In the backend API route, lines like this call the service class:

```python
return WaterService.get_today(db, user_id)
return WaterService.add_water(db, user_id, request)
return WaterService.get_stats(db, user_id)
```

`WaterService` groups related water logic. The API layer handles HTTP; the service layer does the real work.
