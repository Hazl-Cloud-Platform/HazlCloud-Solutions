'use client'

import { ChevronRight } from 'lucide-react'
import { Navbar } from './Navbar'
import { PrimaryButton } from './Buttons'
import { GlassPillWithIcon } from './Buttons'

const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4'

export function Hero() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black text-white flex flex-col">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ objectPosition: 'center' }}
        src={HERO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Bottom-blur veil - no dark overlay, only blur */}
      <div className="hazl-blur-veil-abs" />

      {/* Nav sits above the veil */}
      <Navbar />

      {/* Hero copy - anchored to bottom */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-8 md:pb-14">
        <div className="flex flex-col md:flex-row items-end gap-8">
          <div className="flex-1 min-w-0 max-w-3xl">
            <h1
              className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.08] mb-3 md:mb-4 animate-blur-fade-up hazl-hero-text whitespace-pre-line"
              style={{ animationDelay: '300ms', letterSpacing: '-0.025em' }}
            >
              {'Your technical partner in\nscaling AI-built products.'}
            </h1>

            <p
              className="text-sm sm:text-base md:text-lg text-white/90 mb-5 md:mb-7 max-w-xl animate-blur-fade-up hazl-hero-text"
              style={{ animationDelay: '450ms' }}
            >
              We turn fragile prototypes into reliable, scalable businesses.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <PrimaryButton delay={600} href="https://calendly.com/anthony-tam-hazl/30min">Turn My MVP Into a Real Product</PrimaryButton>
              <GlassPillWithIcon icon={ChevronRight} iconRight delay={750} href="/approach">
                Approach
              </GlassPillWithIcon>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
