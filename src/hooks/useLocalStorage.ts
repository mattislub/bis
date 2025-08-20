import { useState, useEffect } from 'react';

// Allows lazy initialization by accepting a value or a function that returns a value
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  userId?: string
): [T, (value: T | ((val: T) => T)) => void] {
  const storageKey = userId ? `${userId}-${key}` : key;
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        return JSON.parse(item);
      }
      return initialValue instanceof Function ? initialValue() : initialValue;
    } catch (error) {
      console.error(`Error loading ${storageKey} from localStorage:`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValue instanceof Function ? initialValue() : initialValue);
      }
    } catch (error) {
      console.error(`Error loading ${storageKey} from localStorage:`, error);
    }
  }, [storageKey, initialValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(storageKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${storageKey} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}