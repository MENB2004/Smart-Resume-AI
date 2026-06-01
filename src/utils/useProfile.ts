import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROFILE_KEY = '@user_profile';

export interface UserProfile {
  displayName: string;
  tagline: string;
}

const defaultProfile: UserProfile = { displayName: '', tagline: '' };

/**
 * Shared hook to read/write the user's display name and tagline.
 * Works on both native and web (AsyncStorage has a web adapter).
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (updated: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      setProfile(updated);
    } catch (e) {
      console.error('Failed to save profile');
      throw e;
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profile, loading, saveProfile, reload: loadProfile };
};
