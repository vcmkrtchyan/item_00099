import { useLocalStorage } from "./use-local-storage"
import { toast } from "sonner"

export interface Genre {
  id: string
  name: string
  description: string
  isDeleted?: boolean // Added isDeleted flag
}

export function useGenres() {
  const [genres, setGenres] = useLocalStorage<Genre[]>("genres", [])

  // Get only non-deleted genres for the UI
  const visibleGenres = genres.filter((genre) => !genre.isDeleted)

  const addGenre = (genre: Omit<Genre, "id" | "isDeleted">) => {
    const newGenre = {
      ...genre,
      id: crypto.randomUUID(),
      isDeleted: false,
    }
    setGenres((prevGenres) => [...prevGenres, newGenre])
    return newGenre
  }

  const updateGenre = (id: string, updatedGenre: Partial<Genre>) => {
    const genre = genres.find((g) => g.id === id)
    setGenres((prevGenres) => prevGenres.map((genre) => (genre.id === id ? { ...genre, ...updatedGenre } : genre)))

    // Add toast notification for genre update
    if (genre) {
      toast.success(`"${updatedGenre.name || genre.name}" genre has been updated`)
    }
  }

  const deleteGenre = (id: string) => {
    // Find the genre to mark as deleted
    const genreToDelete = genres.find((genre) => genre.id === id && !genre.isDeleted)

    if (!genreToDelete) return false

    // Mark the genre as deleted
    setGenres((prevGenres) => prevGenres.map((genre) => (genre.id === id ? { ...genre, isDeleted: true } : genre)))

    // Show toast notification with undo option
    toast(`"${genreToDelete.name}" genre has been deleted`, {
      action: {
        label: "Undo",
        onClick: () => undoDeleteGenre(id),
      },
      duration: 5000, // 5 seconds to undo
    })

    return true
  }

  const undoDeleteGenre = (id: string) => {
    console.log("Attempting to undo delete for genre ID:", id)

    // Find the genre to restore
    const genreToRestore = genres.find((genre) => genre.id === id)

    console.log("Genre to restore:", genreToRestore)

    if (!genreToRestore) {
      console.error("Could not find genre with ID:", id)
      return false
    }

    // Mark the genre as not deleted
    setGenres((prevGenres) => {
      const updatedGenres = prevGenres.map((genre) => (genre.id === id ? { ...genre, isDeleted: false } : genre))
      console.log("Updated genres after undo:", updatedGenres)
      return updatedGenres
    })

    // Show confirmation toast
    toast(`"${genreToRestore.name}" genre has been restored`)

    return true
  }

  const getGenre = (id: string) => {
    return genres.find((g) => g.id === id)
  }

  return {
    genres: visibleGenres, // Only return non-deleted genres
    addGenre,
    updateGenre,
    deleteGenre,
    undoDeleteGenre,
    getGenre,
  }
}

