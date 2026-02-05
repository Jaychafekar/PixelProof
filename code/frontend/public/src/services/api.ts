export async function analyzeMedia(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) throw new Error("Analyze failed")
  return res.json()
}
