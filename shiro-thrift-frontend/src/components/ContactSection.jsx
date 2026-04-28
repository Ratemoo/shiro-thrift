import { useState } from "react";

export default function ContactSection() {
  const PHONE = "+254 720 039 832";
  const EMAIL = "suskaj2010@gmail.com";

  const [form, setForm]       = useState({ name: "", email: "", message: "" });
  const [status, setStatus]   = useState(""); // "sending" | "sent" | "error"

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setStatus("error-empty");
      return;
    }

    setStatus("sending");

    // Build a mailto link — opens the customer's email client
    // pre-filled and addressed to Shiro's email
    const subject = encodeURIComponent(`Message from ${form.name} — Shiro's Thrift`);
    const body    = encodeURIComponent(
      `Name: ${form.name}\nFrom: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;

    // Mark as sent after a short delay
    setTimeout(() => {
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    }, 800);
  };

  return (
    <section className="contact-section" id="contact">
      {/* Header */}
      <div className="contact-header">
        <p className="section-eyebrow">Get in Touch</p>
        <h2 className="section-title">Contact Us</h2>
        <div className="section-rule" />
        <p className="contact-intro">
          Have a question about a piece, want to reserve something, or just say hello?
          We'd love to hear from you.
        </p>
      </div>

      <div className="contact-body">
        {/* Contact info cards */}
        <div className="contact-info">
          {/* Phone */}
          <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="contact-card">
            <div className="contact-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.07 1.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div className="contact-card-text">
              <p className="contact-card-label">Call or WhatsApp</p>
              <p className="contact-card-value">{PHONE}</p>
            </div>
          </a>

          {/* Email */}
          <a href={`mailto:${EMAIL}`} className="contact-card">
            <div className="contact-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div className="contact-card-text">
              <p className="contact-card-label">Email Us</p>
              <p className="contact-card-value">{EMAIL}</p>
            </div>
          </a>

          {/* WhatsApp direct */}
          <a
            href={`https://wa.me/254720039832?text=${encodeURIComponent("Hi! I saw something on Shiro's Thrift Collection and I'd like to enquire.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card contact-card--whatsapp"
          >
            <div className="contact-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </div>
            <div className="contact-card-text">
              <p className="contact-card-label">WhatsApp</p>
              <p className="contact-card-value">Chat with us directly</p>
            </div>
          </a>

          {/* Location */}
          <div className="contact-card contact-card--static">
            <div className="contact-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="contact-card-text">
              <p className="contact-card-label">Location</p>
              <p className="contact-card-value">Nairobi, Kenya</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="contact-form-wrap">
          <p className="contact-form-title">Send a Message</p>

          {status === "sent" ? (
            <div className="contact-sent">
              <div className="contact-sent-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>Message Sent!</h3>
              <p>Your email client opened with your message. We'll get back to you soon.</p>
              <button className="contact-reset-btn" onClick={() => setStatus("")}>
                Send Another
              </button>
            </div>
          ) : (
            <div className="contact-form">
              {status === "error-empty" && (
                <div className="flash flash--error">Please fill in all fields before sending.</div>
              )}

              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Jane Wanjiku"
                  value={form.name}
                  onChange={(e) => f("name", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => f("email", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Ask about a piece, request a reservation, or just say hi..."
                  value={form.message}
                  onChange={(e) => f("message", e.target.value)}
                />
              </div>

              <button
                className="contact-submit-btn"
                onClick={handleSubmit}
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <span className="login-spinner" />
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send Message
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}