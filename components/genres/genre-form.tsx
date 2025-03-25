"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Genre } from "@/hooks/use-genres"
import { useLibrary } from "@/context/library-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface GenreFormProps {
  genreId?: string
}

export function GenreForm({ genreId }: GenreFormProps) {
  const router = useRouter()
  const { getGenre, addGenre, updateGenre } = useLibrary()

  const [formData, setFormData] = useState<Omit<Genre, "id">>({
    name: "",
    description: "",
  })

  useEffect(() => {
    if (genreId) {
      const genre = getGenre(genreId)
      if (genre) {
        setFormData({
          name: genre.name,
          description: genre.description,
        })
      }
    }
  }, [genreId, getGenre])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (genreId) {
      updateGenre(genreId, formData)
    } else {
      addGenre(formData)
    }

    router.push("/genres")
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{genreId ? "Edit Genre" : "Add New Genre"}</CardTitle>
          <CardDescription>
            {genreId ? "Update the genre details" : "Enter the details for a new genre"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">{genreId ? "Update Genre" : "Add Genre"}</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

