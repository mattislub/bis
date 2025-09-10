import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api';

export function useServerStorage<T>(
  key: string,
  initialValue: T | (() => T),
  userId?: string
): [T, (value: T | ((val: T) => T)) => void] {
  const storageKey = userId ? `${userId}-${key}` : key;
  const initialRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState<T>(() => {
    return initialRef.current instanceof Function
      ? initialRef.current()
      : initialRef.current;
  });
  // Prevent server response from overwriting local updates made before the fetch completes
  const skipInitialSet = useRef(false);

  useEffect(() => {
    skipInitialSet.current = false;
    const fetchValue = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/storage/${storageKey}`, {
          headers: userId ? { 'X-User-Email': userId } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          if (data !== null && !skipInitialSet.current) {
            setStoredValue(data);
          }
        }
      } catch (error) {
        console.error(`Error loading ${storageKey} from server:`, error);
      } finally {
        // Mark that the initial fetch has completed
        skipInitialSet.current = true;
      }
    };
    fetchValue();
  }, [storageKey]);

  const setValue = (value: T | ((val: T) => T)) => {
    // If a local update happens before the initial fetch resolves,
    // prevent the fetched value from overriding the new state
    skipInitialSet.current = true;
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    fetch(`${API_BASE_URL}/api/storage/${storageKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'X-User-Email': userId } : {}),
      },
      body: JSON.stringify(valueToStore),
    }).catch(error => {
      console.error(`Error saving ${storageKey} to server:`, error);
    });
  };

  return [storedValue, setValue];
}
