import Link from "next/link"

export default function ChildSafetyPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-white/60">
          ← Back
        </Link>

        <h1 className="mt-8 text-4xl font-black">Child Safety Standards</h1>

        <p className="mt-2 text-sm text-white/50">
          Psst, developed by Bronyina
        </p>

        <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
          <p>
            Psst has zero tolerance for Child Sexual Abuse and Exploitation
            (CSAE). This applies to every part of the app, including
            confessions, memes, comments, voice notes, polls, and battles.
          </p>

          <p>
            Any account found posting, sharing, soliciting, or linking to
            content that sexually exploits or endangers a minor will be
            permanently banned immediately and without warning. We cooperate
            with law enforcement and the National Center for Missing &amp;
            Exploited Children (NCMEC) where required by law.
          </p>

          <h2 className="pt-2 text-lg font-black text-white">
            Reporting content
          </h2>

          <p>
            Every post, comment, and voice note in Psst has an in-app Report
            button. Reports involving suspected CSAE are reviewed and
            escalated as a priority, and the content and account are removed
            on confirmation.
          </p>

          <h2 className="pt-2 text-lg font-black text-white">
            Child safety contact
          </h2>

          <p>
            If you encounter content on Psst that you believe involves child
            sexual abuse or exploitation, report it in-app using the Report
            button, or contact our child safety point of contact directly at:
          </p>

          <p className="font-bold text-white">obamaappointments@gmail.com</p>

          <p>
            We aim to respond to child safety reports within 24 hours.
          </p>

          <h2 className="pt-2 text-lg font-black text-white">Who can use Psst</h2>

          <p>
            Psst is intended for university students and is not directed at
            or designed for children. Accounts are verified using a school
            email address at signup.
          </p>
        </div>
      </section>
    </main>
  )
}
