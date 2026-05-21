"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"

type Comment = {
  id: string
  text: string
  ghostId: string
  avatarEmoji?: string
  isPrime?: boolean
}

type Post = {
  id: string
  text?: string
  imageUrl?: string
  voiceUrl?: string
  type?: string
  ghostId: string
  avatarEmoji?: string
  isPrime?: boolean
}

export default function PostPage() {
  const params = useParams()
  const id = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function loadPost() {
      const snap = await getDoc(doc(db, "posts", id))

      if (snap.exists()) {
        setPost({
          id: snap.id,
          ...snap.data(),
        } as Post)
      }
    }

    loadPost()

    const q = query(
      collection(db, "posts", id, "comments"),
      orderBy("createdAt", "asc")
    )

    const unsub = onSnapshot(q, (snapshot) => {
      setComments(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Comment[]
      )
    })

    return () => unsub()
  }, [id])

  async function sendComment() {
    if (!text.trim() || sending) return

    const user = auth.currentUser
    if (!user) return

    setSending(true)

    try {
      const profileSnap = await getDoc(doc(db, "users", user.uid))
      if (!profileSnap.exists()) return

      const profile = profileSnap.data()

      await addDoc(collection(db, "posts", id, "comments"), {
        text: text.trim(),
        ghostId: profile.ghostId,
        avatarEmoji: profile.avatarEmoji || "👻",
        isPrime: profile.isPrime || false,
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, "posts", id), {
        commentsCount: increment(1),
      })

      setText("")
    } finally {
      setSending(false)
    }
  }

  if (!post) {
    return <main className="min-h-screen p-5 text-white">Loading...</main>
  }

  return (
    <main className="min-h-screen px-5 pb-32 pt-6 text-white">
      <section className="mx-auto max-w-md">
        <Link
          href="/feed"
          className="mb-5 inline-block text-sm font-bold text-white/60"
        >
          ← Back to feed
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{post.avatarEmoji || "👻"}</span>

              <p className="font-bold text-purple-200">
                {post.ghostId}

                {post.isPrime && (
                  <span className="ml-2 rounded-full bg-yellow-300 px-2 py-1 text-[10px] font-black text-black">
                    PRIME
                  </span>
                )}
              </p>
            </div>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-white/70">
              {post.type || "confession"}
            </span>
          </div>

          {post.text && (
            <p className="mt-4 text-lg leading-7">{post.text}</p>
          )}

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="post"
              className="mt-4 w-full rounded-2xl"
            />
          )}

          {post.voiceUrl && (
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <audio
                controls
                preload="none"
                src={post.voiceUrl}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{comment.avatarEmoji || "👻"}</span>

                <p className="text-sm font-bold text-purple-200">
                  {comment.ghostId}

                  {comment.isPrime && (
                    <span className="ml-2 rounded-full bg-yellow-300 px-2 py-1 text-[10px] font-black text-black">
                      PRIME
                    </span>
                  )}
                </p>
              </div>

              <p className="mt-2 text-white/90">{comment.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black p-4">
        <div className="mx-auto flex max-w-md gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Drop your reply 👀"
            className="flex-1 rounded-2xl bg-white/10 p-4 outline-none"
          />

          <button
            onClick={sendComment}
            disabled={sending}
            className="rounded-2xl bg-white px-5 font-bold text-black disabled:opacity-50"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  )
}