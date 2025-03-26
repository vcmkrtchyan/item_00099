"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useLibrary } from "@/context/library-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

interface GenreFormProps {
  genreId?: string
}

// Create the genre schema
const genreSchema = z.object({
  name: z.string().min(1, "Genre name is required"),
  description: z.string().optional(),
})

type GenreFormValues = z.infer<typeof genreSchema>

export function GenreForm({ genreId }: GenreFormProps) {
  const router = useRouter()
  const { getGenre, addGenre, updateGenre, genres } = useLibrary()

  // Initialize form
  const form = useForm<GenreFormValues>({
    resolver: zodResolver(genreSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  // Load existing genre data if in edit mode
  useEffect(() => {
    if (genreId) {
      const genre = getGenre(genreId)
      if (genre) {
        form.reset({
          name: genre.name,
          description: genre.description,
        })
      }
    }
  }, [genreId, getGenre, form])

  // Form submission handler
  const onSubmit = (data: GenreFormValues) => {
    // Check if a genre with the same name already exists (case insensitive)
    const genreExists = genres.some(
      (genre) => genre.name.toLowerCase() === data.name.toLowerCase() && (!genreId || genre.id !== genreId),
    )

    if (genreExists) {
      // Show error message using form validation
      form.setError("name", {
        type: "manual",
        message: "A genre with this name already exists. Please use a unique name.",
      })
      return
    }

    if (genreId) {
      updateGenre(genreId, data)
      toast(`Genre "${data.name}" updated successfully`)
    } else {
      addGenre(data)
      toast(`Genre "${data.name}" added successfully`)
    }

    router.push("/genres")
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>{genreId ? "Edit Genre" : "Add New Genre"}</CardTitle>
            <CardDescription>
              {genreId ? "Update the genre details" : "Enter the details for a new genre"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Enter a unique name for this genre</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>Provide a brief description of this genre (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">{genreId ? "Update Genre" : "Add Genre"}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

