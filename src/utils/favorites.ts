export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export const setCookie = (name: string, value: string, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
};

export interface FavoritesData {
  drivers: string[];
  routes: { origem: string; destino: string }[];
}

const COOKIE_KEY = 'rm_favs_v1';

export const getFavorites = (): FavoritesData => {
  const data = getCookie(COOKIE_KEY);
  try {
    return data ? JSON.parse(decodeURIComponent(data)) : { drivers: [], routes: [] };
  } catch {
    return { drivers: [], routes: [] };
  }
};

export const saveFavorites = (favs: FavoritesData) => {
  setCookie(COOKIE_KEY, encodeURIComponent(JSON.stringify(favs)));
};

export const toggleFavoriteRoute = (origem: string, destino: string) => {
  const favs = getFavorites();
  const index = favs.routes.findIndex(r => r.origem === origem && r.destino === destino);
  if (index >= 0) {
    favs.routes.splice(index, 1);
  } else {
    favs.routes.push({ origem, destino });
  }
  saveFavorites(favs);
};

export const isFavoriteRoute = (origem: string, destino: string) => {
  const favs = getFavorites();
  return favs.routes.some(r => r.origem === origem && r.destino === destino);
};
