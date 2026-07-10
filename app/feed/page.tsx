"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { useUserProfile } from "@/lib/firebase/use-user-profile"

type Post = {
  id: string
  text?: string
  uid: string
  imageUrl?: string
  type?: string
  campus: string
  program?: string
  programLevel?: string
  programKey?: string
  boostedUntil?: any
  voiceUrl?: string
  boosted?: boolean
  avatarEmoji?: string
  pollOptions?: string[]
  pollVotes?: Record<string, string>
  isPrime?: boolean
  ghostId: string
  yeahs: number
  commentsCount?: number
  createdAt?: any
}

const filters = ["all", "confession", "gossip", "meme", "poll", "voice"]

function isBoostActive(boostedUntil: any) {
  if (!boostedUntil) return false

  const boostDate = boostedUntil?.toDate
    ? boostedUntil.toDate()
    : new Date(boostedUntil)

  return boostDate > new Date()
}

export default function FeedPage() {
  const router = useRouter()
  const { user, profile, loading } = useUserProfile()

  const [posts, setPosts] = useState<Post[]>([])
  const [activeType, setActiveType] = useState("all")
  const [feedMode, setFeedMode] = useState<"all" | "campus" | "program">("campus")
  const [yeahedPosts, setYeahedPosts] = useState<string[]>([])

  useEffect(() => {
    if (loading) return

    if (!user || !profile) {
      router.push("/")
      return
    }

    const postsQuery =
      feedMode === "all"
        ? query(collection(db, "posts"), orderBy("createdAt", "desc"))
        : feedMode === "program" && profile.programKey
        ? query(
            collection(db, "posts"),
            where("campus", "==", profile.campus),
            where("programKey", "==", profile.programKey),
            orderBy("createdAt", "desc")
          )
        : query(
            collection(db, "posts"),
            where("campus", "==", profile.campus),
            orderBy("createdAt", "desc")
          )

    const unsub = onSnapshot(postsQuery, async (snapshot) => {
      const loadedPosts = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Post[]

      const sortedPosts = [...loadedPosts].sort((a, b) => {
        const aActive = isBoostActive(a.boostedUntil)
        const bActive = isBoostActive(b.boostedUntil)

        if (aActive && !bActive) return -1
        if (!aActive && bActive) return 1

        return 0
      })

      setPosts(sortedPosts)

      const checks = await Promise.all(
        loadedPosts.map(async (post) => {
          const yeahSnap = await getDoc(
            doc(db, "posts", post.id, "yeahsBy", user.uid)
          )

          return yeahSnap.exists() ? post.id : null
        })
      )

      setYeahedPosts(checks.filter(Boolean) as string[])
    })

    return () => unsub()
  }, [user, profile, loading, router, feedMode])

  async function handleYeah(post: Post) {
    if (!user) return
    if (post.uid === user.uid) return
    if (yeahedPosts.includes(post.id)) return

    const postRef = doc(db, "posts", post.id)
    const yeahRef = doc(db, "posts", post.id, "yeahsBy", user.uid)
    const postOwnerRef = doc(db, "users", post.uid)

    try {
      await runTransaction(db, async (transaction) => {
        const yeahSnap = await transaction.get(yeahRef)

        if (yeahSnap.exists()) {
          throw new Error("already-yeahed")
        }

        transaction.set(yeahRef, {
          uid: user.uid,
          createdAt: serverTimestamp(),
        })

        transaction.update(postRef, {
          yeahs: increment(1),
        })

        transaction.update(postOwnerRef, {
          ghostCoins: increment(1),
        })
      })

      setYeahedPosts((prev) =>
        prev.includes(post.id) ? prev : [...prev, post.id]
      )
    } catch (error) {
      console.error("Yeah failed:", error)
    }
  }

  async function handlePollVote(postId: string, option: string) {
    if (!user) return

    await updateDoc(doc(db, "posts", postId), {
      [`pollVotes.${user.uid}`]: option,
    })
  }

  const filteredPosts = posts.filter(
    (post) => activeType === "all" || post.type === activeType
  )

  if (loading) {
    return <main className="min-h-screen px-5 py-6 text-white">Loading...</main>
  }

  return (
    <main className="min-h-screen px-5 pb-28 pt-6 text-white">
      <section className="mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Psst 👻</h1>
            <p className="text-sm text-white/50">
              {feedMode === "all"
                ? "All campuses"
                : feedMode === "program"
                ? `${profile?.campus} • ${profile?.program || "My Program"}`
                : profile?.campus}
            </p>
          </div>

          <Link
            href="/create"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
          >
            Post
          </Link>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <button
            onClick={() => setFeedMode("all")}
            className={`rounded-2xl p-3 text-sm font-black ${
              feedMode === "all"
                ? "bg-white text-black"
                : "bg-white/10 text-white"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFeedMode("campus")}
            className={`rounded-2xl p-3 text-sm font-black ${
              feedMode === "campus"
                ? "bg-white text-black"
                : "bg-white/10 text-white"
            }`}
          >
            My Campus
          </button>

          <button
            onClick={() => setFeedMode("program")}
            className={`rounded-2xl p-3 text-sm font-black ${
              feedMode === "program"
                ? "bg-white text-black"
                : "bg-white/10 text-white"
            }`}
          >
            My Program
          </button>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {filters.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${
                activeType === type
                  ? "bg-white text-black"
                  : "bg-white/10 text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {filteredPosts.length === 0 && (
            <p className="rounded-2xl bg-white/10 p-4 text-white/60">
              No gist here yet.
            </p>
          )}

          {filteredPosts.map((post) => {
            const alreadyYeahed = yeahedPosts.includes(post.id)
            const isOwnPost = user?.uid === post.uid
            const boosted = isBoostActive(post.boostedUntil)

            return (
              <article
                key={post.id}
                className={`overflow-hidden rounded-[2rem] border p-5 shadow-2xl backdrop-blur ${
                  post.isPrime
                    ? "border-yellow-300/30 bg-gradient-to-br from-yellow-300/10 to-white/5"
                    : "border-white/10 bg-gradient-to-br from-white/10 to-white/5"
                }`}
              >
                <Link href={`/post/${post.id}`} className="block">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-2xl">
                        {post.avatarEmoji || "👻"}
                      </span>

                      <p className="text-sm font-bold text-purple-200">
                        {post.ghostId}

                        {post.isPrime && (
                          <span className="ml-1 text-yellow-300">👑</span>
                        )}

                        {post.isPrime && (
                          <span className="ml-2 rounded-full bg-yellow-300 px-2 py-1 text-[10px] font-black text-black shadow-[0_0_20px_rgba(253,224,71,0.8)]">
                            PRIME
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/70">
                        {post.type === "voice"
                          ? "🎙️ voice"
                          : post.type || "confession"}
                      </span>

                      {feedMode === "all" && (
                        <span className="rounded-full bg-purple-400/20 px-3 py-1 text-xs font-bold text-purple-200">
                          {post.campus}
                        </span>
                      )}

                      {boosted && (
                        <span className="rounded-full bg-pink-400 px-3 py-1 text-xs font-black text-black">
                          BOOSTED
                        </span>
                      )}
                    </div>
                  </div>

                  {post.text && (
                    <p className="mt-3 text-lg leading-7">{post.text}</p>
                  )}

                  {post.type === "poll" && post.pollOptions && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-white/40">
                        {Object.values(post.pollVotes || {}).length} total votes
                      </p>

                      {post.pollOptions.map((option) => {
                        const votes = Object.values(post.pollVotes || {})
                        const voteCount = votes.filter(
                          (vote) => vote === option
                        ).length
                        const userVote = user ? post.pollVotes?.[user.uid] : null
                        const selected = userVote === option

                        return (
                          <button
                            key={option}
                            onClick={(e) => {
                              e.preventDefault()
                              handlePollVote(post.id, option)
                            }}
                            className={`w-full rounded-2xl p-4 text-left font-bold ${
                              selected
                                ? "bg-white text-black"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <div className="flex justify-between gap-3">
                              <span>
                                {option}
                                {selected && (
                                  <span className="ml-2 text-xs opacity-70">
                                    Your vote
                                  </span>
                                )}
                              </span>

                              <span>{voteCount}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Psst post"
                      className="mt-4 max-h-[500px] w-full rounded-2xl object-cover"
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

                  <p className="mt-4 text-sm font-bold text-purple-200">
                    💬 {post.commentsCount || 0} comments
                  </p>
                </Link>

                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/50">
                  <span className="min-w-0 flex-1">
                    {post.campus}
                    {post.programLevel &&
                      post.program &&
                      ` • ${post.programLevel} ${post.program}`}
                  </span>

                  {user?.uid === post.uid && (
                    <Link
                      href={`/boost/${post.id}`}
                      className="rounded-full bg-pink-400 px-4 py-2 font-bold text-black"
                    >
                      Boost
                    </Link>
                  )}

                  <button
                    onClick={() => handleYeah(post)}
                    disabled={alreadyYeahed || isOwnPost}
                    className={`rounded-full px-4 py-2 font-bold ${
                      alreadyYeahed
                        ? "bg-white text-black"
                        : isOwnPost
                          ? "bg-white/5 text-white/30"
                          : "bg-white/10 text-white"
                    }`}
                  >
                    🔥 {post.yeahs || 0} Yeahs
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <nav className="fixed bottom-4 left-1/2 flex w-[92%] max-w-md -translate-x-1/2 items-center justify-between rounded-3xl border border-white/10 bg-black/80 p-2 backdrop-blur">
        <Link
          href="/feed"
          className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black"
        >
          Feed
        </Link>

        <Link
          href="/leaderboard"
          className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
        >
          Board
        </Link>

        <Link
          href="/create"
          className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
        >
          Post
        </Link>

        <Link
          href="/battles"
          className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
        >
          Battle
        </Link>

        <Link
          href="/lair"
          className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
        >
          Lair
        </Link>
      </nav>
    </main>
  )
}