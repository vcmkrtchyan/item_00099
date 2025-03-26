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
  const { getGenre, addGenre, updateGenre, genres } = useLibrary()

  const [formData, setFormData] = useState<Omit<Genre, "id">>({
    name: "",
    description: "",
  })

  const [error, setError] = useState<string | null>(null)

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
    setError(null) // Clear error when input changes
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if a genre with the same name already exists (case insensitive)
    const genreExists = genres.some(
      (genre) => genre.name.toLowerCase() === formData.name.toLowerCase() && (!genreId || genre.id !== genreId),
    )

    if (genreExists) {
      // Show error message
      setError("A genre with this name already exists. Please use a unique name.")
      return
    }

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
          {error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
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

