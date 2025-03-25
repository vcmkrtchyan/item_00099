import { GenreList } from "@/components/genres/genre-list"

export default function GenresPage() {
  return (
    <div className="space-y-6 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Genres</h1>
        <p className="text-muted-foreground">Manage book genres and categories.</p>
      </div>
      <GenreList />
    </div>
  )
}

