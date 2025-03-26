"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useLibrary } from "@/context/library-context"
import { BookDetail } from "@/components/books/book-detail"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getBook } = useLibrary()

  const bookId = params.id as string
  const book = getBook(bookId)

  // If book doesn't exist, redirect to home page
  useEffect(() => {
    if (!book) {
      router.push("/")
    }
  }, [book, router])

  if (!book) {
    return (
      <div className="space-y-6 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Book Not Found</h1>
          <p className="text-muted-foreground mt-2">The book you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </Link>
      </div>
      <BookDetail book={book} />
    </div>
  )
}

