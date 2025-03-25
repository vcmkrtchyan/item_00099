import { useLocalStorage } from "./use-local-storage"

export interface Genre {
  id: string
  name: string
  description: string
}

export function useGenres() {
  const [genres, setGenres] = useLocalStorage<Genre[]>("genres", [])

  const addGenre = (genre: Omit<Genre, "id">) => {
    const newGenre = {
      ...genre,
      id: crypto.randomUUID(),
    }
    setGenres((prevGenres) => [...prevGenres, newGenre])
    return newGenre
  }

  const updateGenre = (id: string, updatedGenre: Partial<Genre>) => {
    setGenres((prevGenres) => prevGenres.map((genre) => (genre.id === id ? { ...genre, ...updatedGenre } : genre)))
  }

  const deleteGenre = (id: string) => {
    setGenres((prevGenres) => prevGenres.filter((genre) => genre.id !== id))
  }

  const getGenre = (id: string) => {
    return genres.find((genre) => genre.id === id)
  }

  return {
    genres,
    addGenre,
    updateGenre,
    deleteGenre,
    getGenre,
  }
}

