/**
 * Profile service.
 *
 * Read/write the public-facing profile fields. The profile is local
 * by default — fields are stored in localStorage, not pushed to
 * a server. The structure is:
 *
 *   {
 *     displayName: string,
 *     bio:         string (<= 500 chars),
 *     location:    string (<= 80 chars),
 *     website:     string (URL),
 *     social:      { twitter?, github?, mastodon?, linkedin? }
 *   }
 *
 * The `auth` service has the canonical identity fields (email,
 * photo URL from OAuth) but the profile is independent: a guest user
 * can have a profile without signing in.
 */

import * as storage from './storage.js';

const KEY = 'profile';

export const DEFAULT_PROFILE = {
  displayName: '',
  bio: '',
  location: '',
  website: '',
  social: { twitter: '', github: '', mastodon: '', linkedin: '' },
};

export const getProfile = () => {
  const stored = storage.get(KEY) || {};
  return {
    ...DEFAULT_PROFILE,
    ...stored,
    social: { ...DEFAULT_PROFILE.social, ...(stored.social || {}) },
  };
};

export const saveProfile = (profile) => {
  const clean = {
    displayName: (profile.displayName || '').slice(0, 60),
    bio: (profile.bio || '').slice(0, 500),
    location: (profile.location || '').slice(0, 80),
    website: (profile.website || '').slice(0, 200),
    social: {
      twitter: (profile.social?.twitter || '').slice(0, 60),
      github: (profile.social?.github || '').slice(0, 60),
      mastodon: (profile.social?.mastodon || '').slice(0, 120),
      linkedin: (profile.social?.linkedin || '').slice(0, 200),
    },
  };
  return storage.set(KEY, clean);
};
