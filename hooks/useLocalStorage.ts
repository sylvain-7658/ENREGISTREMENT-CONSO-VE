import { useState, useEffect, useRef } from 'react';

// Hook pour lire et écrire dans le localStorage du navigateur.
// Cette version est conçue pour gérer de manière robuste le changement dynamique de la clé de stockage,
// par exemple lors d'un changement de profil utilisateur, en évitant les conditions de course ("race conditions").
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Étape 1 : Initialise l'état en lisant la valeur depuis le localStorage.
  // La fonction passée à useState ne s'exécute qu'une seule fois au montage initial du composant.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erreur à l'initialisation depuis localStorage pour la clé "${key}":`, error);
      return initialValue;
    }
  });

  // Réf pour garder la trace de la clé, afin de distinguer un changement de clé d'un changement de valeur.
  const keyRef = useRef(key);

  // Étape 2 : Un seul effet pour gérer toute la logique de synchronisation.
  useEffect(() => {
    // Cas 1 : La clé a changé (ex: l'utilisateur a changé de profil).
    if (keyRef.current !== key) {
      // On lit la valeur associée à la nouvelle clé et on met à jour l'état.
      // C'est l'opération de "lecture".
      try {
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } catch (error) {
        console.error(`Erreur lors de la lecture du localStorage pour la clé "${key}":`, error);
        setStoredValue(initialValue);
      }
      // On met à jour la réf avec la nouvelle clé pour le prochain rendu.
      keyRef.current = key;
    }
    // Cas 2 : La clé est restée la même, ce qui implique que `storedValue` a pu être modifié.
    else {
      // On écrit la valeur actuelle dans le localStorage.
      // C'est l'opération "d'écriture".
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Erreur lors de l'écriture dans le localStorage pour la clé "${key}":`, error);
      }
    }
  }, [key, storedValue, initialValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
