"use client"

import { useState } from "react"
import { useLibrary } from "@/context/library-context"
import { BookCard } from "./book-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Bookmark, Book } from "lucide-react"
import Link from "next/link"

export function BookList() {
  const { books, genres } = useLibrary()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGenre = selectedGenre === "all" || book.genreIds.includes(selectedGenre)

    return matchesSearch && matchesGenre
  })

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Search input - takes 10 columns */}
          <div className="col-span-10 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Book button - takes 2 columns */}
          <div className="col-span-2">
            <Link href="/create-book" className="block">
              <Button size="sm" className="w-full">
                <Book className="mr-2 h-4 w-4" />
                Add Book
              </Button>
            </Link>
          </div>

          {/* Genre filter - takes 10 columns */}
          <div className="col-span-10">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Genre button - takes 2 columns */}
          <div className="col-span-2">
            <Link href="/genres/new" className="block">
              <Button variant="outline" size="sm" className="w-full">
                <Bookmark className="mr-2 h-4 w-4" />
                Add Genre
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No books found. Try adjusting your filters or add a new book.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}

