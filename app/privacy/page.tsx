import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-between">
        <div>
          <div className="text-6xl">👻</div>

          <h1 className="mt-6 text-4xl font-black">
            You’re anonymous here.
          </h1>

          <p className="mt-6 text-lg leading-8 text-white/70">
            We only ask for your school email to verify you’re a real student.
            Your email is never shown, shared, or connected to your ghost identity.
          </p>

          <p className="mt-4 text-lg leading-8 text-white/70">
            Inside Psst, you exist only as your Ghost ID.
          </p>
        </div>

        <Link
          href="/onboarding"
          className="block rounded-2xl bg-white px-5 py-4 text-center font-bold text-black"
        >
          I understand
        </Link>
      </section>
    </main>
  )
}