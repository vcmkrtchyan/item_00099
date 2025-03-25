"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Book } from "@/hooks/use-books"
import { useLibrary } from "@/context/library-context"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookPlaceholder } from "./book-placeholder"
import { BookOpen } from "lucide-react"

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  const { genres, loans } = useLibrary()
  const [imageError, setImageError] = useState(false)

  const bookGenres = genres.filter((genre) => book.genreIds.includes(genre.id))

  // Check if the book is currently on loan
  const isOnLoan = loans.some((loan) => loan.bookId === book.id && !loan.returned)

  // Get active loan details if the book is on loan
  const activeLoan = isOnLoan ? loans.find((loan) => loan.bookId === book.id && !loan.returned) : null

  // Determine if we should show the image or placeholder
  const showPlaceholder = imageError || !book.coverImageUrl

  return (
    <Card
      className={`overflow-hidden h-full flex flex-col ${isOnLoan ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}
    >
      <div className="relative">
        {/* Loan indicator */}
        {isOnLoan && (
          <div className="absolute top-0 right-0 z-10 m-2">
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
              <BookOpen className="h-3 w-3 mr-1" />
              On Loan
            </Badge>
          </div>
        )}

        <div className="relative aspect-[2/3] w-full h-[160px]">
          {!showPlaceholder ? (
            <Image
              src={book.coverImageUrl || "/placeholder.svg"}
              alt={book.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <BookPlaceholder title={book.title} author={book.author} />
          )}
        </div>
      </div>
      <CardContent className="flex-grow p-3">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-semibold text-sm line-clamp-1 hover:underline">{book.title}</h3>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        {isOnLoan && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 line-clamp-1">
            Borrowed by: {activeLoan?.borrower}
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-1">
          {bookGenres.slice(0, 2).map((genre) => (
            <Badge key={genre.id} variant="secondary" className="text-xs px-1 py-0">
              {genre.name}
            </Badge>
          ))}
          {bookGenres.length > 2 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              +{bookGenres.length - 2} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Link href={`/books/${book.id}`} className="text-xs text-primary hover:underline">
          View details
        </Link>
      </CardFooter>
    </Card>
  )
}

