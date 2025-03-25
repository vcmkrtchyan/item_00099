import { BookForm } from "@/components/books/book-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CreateBookPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </Link>
      </div>
      <div>
        <BookForm />
      </div>
    </div>
  )
}

