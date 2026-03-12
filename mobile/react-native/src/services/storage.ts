import AsyncStorage from '@react-native-async-storage/async-storage';

/** React Native AsyncStorage-backed key-value store. */
export const storageService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch {
      // ignore
    }
  },

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(
      pairs.map(([k, v]) => [k, v ? (JSON.parse(v) as T) : null])
    );
  },
};

export default storageService;
