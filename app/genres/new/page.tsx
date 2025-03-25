import { GenreForm } from "@/components/genres/genre-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewGenrePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/genres">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Genres
          </Button>
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <GenreForm />
      </div>
    </div>
  )
}

