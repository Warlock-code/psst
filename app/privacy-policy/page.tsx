import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/lair" className="text-sm text-white/60">
          ← Back
        </Link>

        <h1 className="mt-8 text-4xl font-black">Privacy Policy</h1>

        <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
          <p>
            Psst is an anonymous campus app. We use your school email only to
            verify that you belong to a campus community.
          </p>

          <p>
            Your email is not shown on posts, comments, battles, polls, voice
            notes, or public profiles.
          </p>

          <p>
            We store your ghost profile, posts, comments, votes, uploaded media,
            payments, and app activity needed to run the service.
          </p>

          <p>
            Payments are processed through Paystack. We do not store your card
            details.
          </p>

          <p>
            You can request account deletion by contacting the Psst team.
          </p>
        </div>
      </section>
    </main>
  )
}