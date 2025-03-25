export function Footer() {
  return (
    <footer className="border-t py-4 bg-background">
      <div className="px-4 md:px-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Personal Library Management &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}

