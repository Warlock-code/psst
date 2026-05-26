"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"

export default function CreatePostPage() {
  const router = useRouter()

  const [text, setText] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [voice, setVoice] = useState<File | null>(null)
  const [category, setCategory] = useState("confession")
  const [pollOptions, setPollOptions] = useState(["", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [recording, setRecording] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function uploadToCloudinary(file: File, resourceType: "image" | "video" = "image") {
    const formData = new FormData()

    formData.append("file", file)
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error?.message || "Cloudinary upload failed")
    }

    return data.secure_url
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Recording is not supported on this device.")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        })

        setVoice(file)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setRecording(true)
    } catch {
      setError("Mic permission denied. Allow microphone access.")
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  async function handlePost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = auth.currentUser

      if (!user) {
        router.push("/login")
        return
      }

      const userSnap = await getDoc(doc(db, "users", user.uid))

      if (!userSnap.exists()) {
        setError("Ghost profile not found.")
        return
      }

      const profile = userSnap.data()
      const cleanPollOptions = pollOptions.filter((option) => option.trim() !== "")

      if (category === "poll" && cleanPollOptions.length < 2) {
        setError("Poll needs at least 2 options.")
        return
      }

      const uploadSize =
        category === "voice"
          ? Math.round((voice?.size || 0) / 1024 / 1024)
          : category === "meme"
            ? Math.round((image?.size || 0) / 1024 / 1024)
            : 0

      const currentStorage = profile.storageUsed || 0
      const storageLimit = profile.storageLimit || 50

      if (!profile.isPrime && currentStorage + uploadSize > storageLimit) {
        setError("Storage full. Upgrade storage.")
        return
      }

      let imageUrl = ""
      let voiceUrl = ""

      if (image && category === "meme") {
        imageUrl = await uploadToCloudinary(image)
      }

      if (voice && category === "voice") {
        voiceUrl = await uploadToCloudinary(voice, "video")
      }

      const now = new Date()
      const today = now.toDateString()
      const lastPostDate = profile.lastPostDate
      const currentStreak = profile.streakCount || 0

      await addDoc(collection(db, "posts"), {
        text,
        imageUrl,
        voiceUrl,
        type: category,
        pollOptions: category === "poll" ? cleanPollOptions : [],
        pollVotes: {},
        campus: profile.campus,
program: profile.program || "",
ghostId: profile.ghostId,
        storageUsed: uploadSize,
        isPrime: profile.isPrime || false,
        avatarEmoji: profile.avatarEmoji || "👻",
        uid: user.uid,
        yeahs: profile.isPrime ? 5 : 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, "users", user.uid), {
        storageUsed: increment(uploadSize),
        lastPostDate: today,
        streakCount: lastPostDate === today ? currentStreak : currentStreak + 1,
      })

      router.push("/feed")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Post failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <h1 className="text-4xl font-black">Drop gist</h1>
        <p className="mt-3 text-white/60">Text, meme, gossip, poll or voice.</p>

        <form onSubmit={handlePost} className="mt-8 space-y-4">
          <textarea
            className="min-h-40 w-full rounded-3xl border border-white/10 bg-white/10 p-4 outline-none"
            placeholder="What happened on campus? 👀"
            maxLength={280}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="grid grid-cols-5 gap-2">
            {["confession", "gossip", "meme", "poll", "voice"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-2xl p-3 text-xs font-bold capitalize ${
                  category === item ? "bg-white text-black" : "bg-white/10 text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {category === "poll" && (
            <div className="space-y-3">
              {pollOptions.map((option, index) => (
                <input
                  key={index}
                  value={option}
                  onChange={(e) => {
                    const updated = [...pollOptions]
                    updated[index] = e.target.value
                    setPollOptions(updated)
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
                />
              ))}
            </div>
          )}

          {category === "meme" && (
            <label className="block rounded-3xl border border-dashed border-white/20 bg-white/10 p-5 text-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {image ? image.name : "Tap to add meme/image"}
            </label>
          )}

          {category === "voice" && (
            <div className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-center">
                <p className="font-bold">
                  {voice ? voice.name : "Record or upload voice note"}
                </p>

                {voice && (
                  <audio
                    controls
                    src={URL.createObjectURL(voice)}
                    className="mt-4 w-full"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!recording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="rounded-2xl bg-white p-4 font-bold text-black"
                  >
                    🎙️ Record
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="rounded-2xl bg-red-400 p-4 font-bold text-black"
                  >
                    Stop
                  </button>
                )}

                <label className="rounded-2xl bg-white/10 p-4 text-center font-bold">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setVoice(e.target.files?.[0] || null)}
                  />
                  Upload
                </label>
              </div>
            </div>
          )}

          <p className="text-right text-xs text-white/40">{text.length}/280</p>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            disabled={
              loading ||
              (category === "confession" && !text.trim()) ||
              (category === "gossip" && !text.trim()) ||
              (category === "meme" && !image) ||
              (category === "voice" && !voice) ||
              (category === "poll" &&
                pollOptions.filter((option) => option.trim() !== "").length < 2)
            }
            className="w-full rounded-2xl bg-white p-4 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post anonymously"}
          </button>
        </form>
      </section>

      <nav className="fixed bottom-4 left-1/2 flex w-[92%] max-w-md -translate-x-1/2 items-center justify-between rounded-3xl border border-white/10 bg-black/80 p-2 backdrop-blur">
        <Link href="/feed" className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70">
          Feed
        </Link>

        <Link href="/leaderboard" className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70">
          Board
        </Link>

        <Link href="/create" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black">
          Post
        </Link>

        <Link href="/battles" className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70">
          Battle
        </Link>

        <Link href="/lair" className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70">
          Lair
        </Link>
      </nav>
    </main>
  )
}