import type { Metadata } from "next";

import { HiddenGate } from "@/components/HiddenGate";

export const metadata: Metadata = {
  title: "Nythia Consulting — IT Infrastructure & Advisory",
  description:
    "Nythia Consulting provides enterprise IT infrastructure, cloud migration, and compliance advisory services for mid-size businesses.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#333]">
      <header className="border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-[#555]">
            Nythia Consulting
          </span>
          <nav className="flex gap-6 text-sm text-[#777]">
            <a href="#services" className="hover:text-[#444]">
              Services
            </a>
            <a href="#about" className="hover:text-[#444]">
              About
            </a>
            <a href="#contact" className="hover:text-[#444]">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-3xl font-semibold leading-tight text-[#444]">
            IT Infrastructure &amp; Advisory Services
          </h1>
          <p className="mt-4 max-w-2xl text-[#777] leading-relaxed">
            We help mid-size businesses streamline their IT operations through
            cloud migration, infrastructure auditing, and compliance advisory.
            Our team of certified engineers ensures your systems meet industry
            standards.
          </p>
        </section>

        <section
          id="services"
          className="border-t border-[#e8e8e8] bg-white py-16"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-xl font-semibold text-[#555]">Our Services</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              <div>
                <h3 className="font-medium text-[#444]">Cloud Migration</h3>
                <p className="mt-2 text-sm text-[#888] leading-relaxed">
                  Seamless migration from on-premise to AWS, Azure, or GCP with
                  minimal downtime and full data integrity verification.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[#444]">
                  Infrastructure Audit
                </h3>
                <p className="mt-2 text-sm text-[#888] leading-relaxed">
                  Comprehensive assessment of your existing infrastructure,
                  identifying bottlenecks, security gaps, and optimization
                  opportunities.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[#444]">
                  Compliance Advisory
                </h3>
                <p className="mt-2 text-sm text-[#888] leading-relaxed">
                  ISO 27001, SOC 2, and GDPR compliance guidance with
                  documentation support and internal audit preparation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="border-t border-[#e8e8e8] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-xl font-semibold text-[#555]">About Us</h2>
            <p className="mt-4 max-w-2xl text-sm text-[#888] leading-relaxed">
              Founded in 2019, Nythia Consulting is a small team of IT
              professionals based in Ankara, Turkey. We specialize in helping
              organizations modernize their technology stack while maintaining
              regulatory compliance. Our clients include logistics companies,
              healthcare providers, and financial services firms.
            </p>
          </div>
        </section>

        <section
          id="contact"
          className="border-t border-[#e8e8e8] bg-white py-16"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-xl font-semibold text-[#555]">Contact</h2>
            <p className="mt-4 text-sm text-[#888]">
              For inquiries, please reach out via email.
            </p>
            <p className="mt-2 text-sm text-[#666]">
              info@nythiaconsulting.com
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e0e0e0] bg-white py-6">
        <div className="mx-auto max-w-5xl px-6 text-xs text-[#aaa]">
          <span>&copy; 2024 Nythia Consulting. All rights reserved.</span>
        </div>
      </footer>

      <HiddenGate />
    </div>
  );
}
