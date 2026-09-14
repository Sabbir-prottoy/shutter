import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const faqs = [
  {
    q: 'What is ShutterShot?',
    a: 'ShutterShot is a marketplace that connects clients with local photographers. You can browse photographer profiles and portfolios, check their availability, and book a session directly through the site.',
  },
  {
    q: 'How do I book a photographer?',
    a: 'Open a photographer\'s profile, pick a package, choose an open date and time slot, and fill in your contact details. You\'ll verify your phone number with a one-time code before the booking is sent to the photographer.',
  },
  {
    q: 'Why do I need to verify my phone number with an OTP?',
    a: 'The OTP step confirms the number you gave is real and reachable, so the photographer can actually contact you about your session. A booking only moves to "confirmed" after this verification succeeds.',
  },
  {
    q: 'Can I cancel or reschedule a booking?',
    a: 'A booking can be cancelled while it\'s pending or confirmed, which frees up the date on the photographer\'s calendar. To reschedule, cancel the existing booking and create a new one for the date you want — see the Booking & Cancellation Policy below.',
  },
  {
    q: 'How do photographers join ShutterShot?',
    a: 'Use "Join as photographer" in the navigation bar to register. You\'ll get a dashboard to manage your portfolio, packages, calendar availability, and incoming booking requests.',
  },
  {
    q: 'How are photographers verified?',
    a: 'Portfolio images go through a moderation review, including a check of embedded photo metadata, before they\'re shown as verified. See the Photographer Verification Policy below for details.',
  },
  {
    q: 'Is payment handled through the site?',
    a: 'ShutterShot is a booking and discovery platform — it connects you with the photographer and confirms your session details. Payment terms are arranged directly with your photographer unless stated otherwise on their profile.',
  },
  {
    q: 'What if my verification code doesn\'t arrive?',
    a: 'Double check the number you entered is correct and try resending the code. If it still doesn\'t arrive, contact support using the details at the bottom of this page.',
  },
  {
    q: 'How do I leave a review?',
    a: 'Once a booking is marked completed, you\'ll be able to leave a rating and comment on the photographer\'s profile. Reviews go through moderation before appearing publicly.',
  },
  {
    q: 'How do I contact support?',
    a: 'Email us at support@shuttershot.local and we\'ll get back to you as soon as we can.',
  },
]

const policies = [
  {
    title: 'Booking & Cancellation Policy',
    body: [
      'A booking starts as "pending" once you submit it and moves to "confirmed" only after phone verification succeeds. Photographers review pending bookings and may accept, decline, or later mark a confirmed booking as completed.',
      'You may cancel a pending or confirmed booking at any time before the session date. Cancelling automatically releases the date back onto the photographer\'s calendar. Repeated last-minute cancellations may be noted on your account.',
      'Rescheduling is done by cancelling the existing booking and creating a new one for your preferred date and time — there is no separate reschedule action.',
    ],
  },
  {
    title: 'Phone Verification Policy',
    body: [
      'Every booking requires a one-time verification code sent to the phone number you provide. Codes expire a short time after they\'re issued, and each code can only be used once.',
      'Providing a phone number that is not yours, or attempting to bypass verification, is a violation of these rules and may result in the booking being cancelled and the account being restricted.',
    ],
  },
  {
    title: 'Photographer Verification & Portfolio Policy',
    body: [
      'Photographers upload portfolio images that go through admin review before being marked verified. Reviewers may check embedded photo metadata as part of confirming the work is genuinely the photographer\'s own.',
      'Uploading images you don\'t hold the rights to, or misrepresenting your work, is grounds for content removal and account suspension.',
    ],
  },
  {
    title: 'User Conduct',
    body: [
      'Treat photographers and other users with respect in all messages and reviews. Harassment, discriminatory language, or abusive behavior toward anyone on the platform is not tolerated.',
      'Reviews must reflect a genuine completed booking. Fake, incentivized, or retaliatory reviews may be removed by moderators.',
    ],
  },
  {
    title: 'Privacy Policy',
    body: [
      'We collect the account and booking details you provide — name, email, phone number, and booking information — to operate the marketplace: matching clients with photographers, sending verification codes, and enabling booking communication.',
      'Your phone number is used only for OTP verification and booking-related contact by the photographer you booked. We do not sell your personal information to third parties.',
    ],
  },
  {
    title: 'Payments & Refunds',
    body: [
      'ShutterShot facilitates discovery and booking; it does not process payments between clients and photographers directly. Payment amount, method, and timing are agreed between you and your photographer.',
      'Refund or deposit terms, where applicable, are set by the individual photographer — check their profile or confirm directly with them before booking.',
    ],
  },
  {
    title: 'Account Suspension & Enforcement',
    body: [
      'Accounts that violate these rules — including conduct violations, fraudulent portfolio content, or attempts to bypass verification — may be warned, restricted, or suspended by an administrator.',
      'If you believe your account was actioned in error, contact support using the details below.',
    ],
  },
]

export default function FAQ() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">FAQs &amp; Policies</h1>
        <p className="mt-3 text-ink-muted">
          Answers to common questions, plus the policies and rules that govern how ShutterShot works.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-ink">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-card border border-border bg-surface px-4 py-3 shadow-card open:shadow-hover"
              >
                <summary className="cursor-pointer list-none font-medium text-ink marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="shrink-0 text-accent transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-ink-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-ink">Policies &amp; rules</h2>
          <div className="mt-4 space-y-8">
            {policies.map((section) => (
              <div key={section.title}>
                <h3 className="font-display text-lg font-bold text-ink">{section.title}</h3>
                <div className="mt-2 space-y-2">
                  {section.body.map((paragraph, index) => (
                    <p key={index} className="text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-card border border-border bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Still have a question?</h2>
          <p className="mt-2 text-ink-muted">
            Reach out at{' '}
            <a href="mailto:support@shuttershot.local" className="text-accent underline">
              support@shuttershot.local
            </a>{' '}
            and we'll get back to you.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
