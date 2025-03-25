/**
 * Validates ISBN-10 and ISBN-13 formats
 * Allows for hyphens in the ISBN
 */
export function validateISBN(isbn: string): boolean {
  // Remove hyphens and spaces
  const cleanedISBN = isbn.replace(/[-\s]/g, "")

  // Check if it's a valid ISBN-10
  if (cleanedISBN.length === 10) {
    // ISBN-10 should only contain digits or 'X' at the end
    if (!/^[0-9]{9}[0-9X]$/.test(cleanedISBN)) {
      return false
    }

    // Calculate ISBN-10 checksum
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(cleanedISBN[i]) * (10 - i)
    }

    // Handle the last character (can be 'X' which equals 10)
    const lastChar = cleanedISBN[9]
    sum += lastChar === "X" ? 10 : Number.parseInt(lastChar)

    return sum % 11 === 0
  }

  // Check if it's a valid ISBN-13
  else if (cleanedISBN.length === 13) {
    // ISBN-13 should only contain digits
    if (!/^[0-9]{13}$/.test(cleanedISBN)) {
      return false
    }

    // Calculate ISBN-13 checksum
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(cleanedISBN[i]) * (i % 2 === 0 ? 1 : 3)
    }

    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit === Number.parseInt(cleanedISBN[12])
  }

  // Not a valid ISBN length
  return false
}

/**
 * Validates if a string is a valid image URL
 * Basic URL validation without extension checking
 */
export function validateImageUrl(url: string): boolean {
  // If empty, consider it valid (since it's optional)
  if (!url.trim()) {
    return true
  }

  try {
    // Check if it's a valid URL
    new URL(url)
    return true
  } catch (e) {
    // Not a valid URL
    return false
  }
}

