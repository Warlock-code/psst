import Link from "next/link"

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/lair" className="text-sm text-white/60">
          ← Back
        </Link>

        <h1 className="mt-8 text-4xl font-black">Content Disclaimer</h1>

        <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
          <p>
            Psst is an anonymous platform where users can share posts, comments,
            polls, voice notes, opinions, jokes, stories, and other content.
          </p>

          <p>
            Content on Psst is created by users. Psst does not verify, confirm,
            guarantee, or endorse the accuracy, truthfulness, reliability, or
            completeness of user-generated content.
          </p>

          <p>
            Posts may contain opinions, satire, rumours, jokes, fictional stories,
            personal viewpoints, exaggeration, or inaccurate information.
          </p>

          <p>
            Users should not treat content on Psst as verified fact.
          </p>

          <p>
            Each user is responsible for what they post. Psst may remove content
            that violates app rules, school policies, local laws, or community
            safety standards.
          </p>
        </div>
      </section>
    </main>
  )
}