export const imageUrlToArrayBuffer = async (
  imageUrl: string
): Promise<ArrayBuffer> => {
  try {
    const response = await fetch(imageUrl)

    if (!response.ok)
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      )

    const arrayBuffer = await response.arrayBuffer()
    return arrayBuffer
  } catch (error) {
    throw new Error(
      `Error converting image URL to ArrayBuffer: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
