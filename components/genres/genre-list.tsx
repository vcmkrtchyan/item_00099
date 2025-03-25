"use client"

import { useState } from "react"
import { useLibrary } from "@/context/library-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash, Book } from "lucide-react"
import Link from "next/link"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function GenreList() {
  const { genres, deleteGenre, books } = useLibrary()
  const [searchTerm, setSearchTerm] = useState("")
  const [genreToDelete, setGenreToDelete] = useState<string | null>(null)

  const filteredGenres = genres.filter((genre) => genre.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getBookCountByGenre = (genreId: string) => {
    return books.filter((book) => book.genreIds.includes(genreId)).length
  }

  const handleDeleteGenre = () => {
    if (genreToDelete) {
      deleteGenre(genreToDelete)
      setGenreToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search genres..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/genres/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Genre
          </Button>
        </Link>
      </div>

      {filteredGenres.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No genres found. Try adjusting your search or add a new genre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGenres.map((genre) => {
            const bookCount = getBookCountByGenre(genre.id)

            return (
              <Card key={genre.id}>
                <CardHeader>
                  <CardTitle>{genre.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Book className="h-4 w-4" />
                    {bookCount} {bookCount === 1 ? "book" : "books"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {genre.description || "No description available."}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href={`/genres/${genre.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>

                  <ConfirmationDialog
                    open={genreToDelete === genre.id}
                    onOpenChange={(open) => {
                      if (!open) setGenreToDelete(null)
                    }}
                    title="Delete Genre"
                    description={`Are you sure you want to delete "${genre.name}"? This action cannot be undone.`}
                    onConfirm={handleDeleteGenre}
                  >
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => setGenreToDelete(genre.id)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                  </ConfirmationDialog>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

