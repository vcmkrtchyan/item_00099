import { BookList } from "@/components/books/book-list"

export default function Home() {
  return (
    <div className="space-y-6 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Books</h1>
        <p className="text-muted-foreground">Browse and manage your book collection.</p>
      </div>
      <BookList />
    </div>
  )
}

