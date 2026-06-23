import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/lair" className="text-sm text-white/60">
          ← Back
        </Link>

        <h1 className="mt-8 text-4xl font-black">Terms & Conditions</h1>

        <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
          <p>
            By using Psst, you agree to use the app responsibly and follow your
            campus laws, school policies, and local laws.
          </p>

          <p>
            Do not post threats, harassment, hate speech, sexual exploitation,
            private personal information, scams, or illegal content.
          </p>

          <p>
            Psst may remove content, restrict accounts, or block users who abuse
            the platform.
          </p>

          <p>
            Paid features such as Prime, storage upgrades, and cosmetics are
            digital purchases. Refunds are handled case by case.
          </p>

          <p>
            Psst is provided as-is. Features may change as the app improves.
          </p>
          <p>
  Psst is not responsible for verifying user-generated posts. Content may include
  opinions, jokes, rumours, satire, fictional stories, or inaccurate information.
  Users should not treat posts as verified facts.
</p>
        </div>
      </section>
    </main>
  )
}