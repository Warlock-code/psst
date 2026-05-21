import Link from "next/link"

const campuses = [
  "University of Ghana",
  "KNUST",
  "UCC",
  "GCTU",
  "UPSA",
  "Ashesi",
]

export default function OnboardingPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-white/60">
          ← Back
        </Link>

        <h1 className="mt-8 text-4xl font-black">Pick your campus</h1>
        <p className="mt-3 text-white/60">
          Once you enter a campus, your feed becomes that school’s ghost world.
        </p>

        <div className="mt-8 space-y-3">
          {campuses.map((campus) => (
            <Link
              key={campus}
              href={`/signup?campus=${encodeURIComponent(campus)}`}
              className="block rounded-2xl border border-white/10 bg-white/10 p-4 font-semibold"
            >
              {campus}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}