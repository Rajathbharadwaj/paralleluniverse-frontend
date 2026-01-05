"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface BookingData {
  id: string;
  proposed_datetime: string;
  phone_number: string;
  status: string;
}

export default function BookingPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [datetime, setDatetime] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-api-644185288504.us-central1.run.app";

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`${API_URL}/booking/${bookingId}`);

        if (res.status === 404) {
          setError("not_found");
          return;
        }

        // Check if it's HTML (form page) or JSON (error)
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("text/html")) {
          // Backend returned HTML - parse the status from it
          const html = await res.text();

          if (html.includes("Already Confirmed") || html.includes("already submitted")) {
            setError("already_submitted");
            return;
          }

          if (html.includes("Link Expired") || html.includes("expired")) {
            setError("expired");
            return;
          }

          // Extract proposed datetime from the HTML if possible
          const timeMatch = html.match(/value="(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})"/);
          if (timeMatch) {
            setDatetime(timeMatch[1]);
          }

          setBooking({
            id: bookingId,
            proposed_datetime: timeMatch ? timeMatch[1] : "",
            phone_number: "",
            status: "pending",
          });
        } else {
          // JSON response
          const data = await res.json();
          if (data.detail) {
            setError(data.detail);
          } else {
            setBooking(data);
            if (data.proposed_datetime) {
              setDatetime(data.proposed_datetime.slice(0, 16));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch booking:", err);
        setError("Failed to load booking");
      } finally {
        setLoading(false);
      }
    }

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, API_URL]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/booking/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: company || null,
          datetime,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.detail || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (error === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600">This booking link may be incorrect or the booking has been removed.</p>
        </div>
      </div>
    );
  }

  if (error === "already_submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Confirmed</h1>
          <p className="text-gray-600">This booking has already been confirmed. Check your email for the calendar invite!</p>
        </div>
      </div>
    );
  }

  if (error === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600">This booking link has expired. Please contact us to reschedule your demo.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h1>
          <p className="text-gray-600">Your demo is confirmed. You&apos;ll receive a calendar invite shortly.</p>
        </div>
      </div>
    );
  }

  // Form
  const proposedTime = datetime
    ? new Date(datetime).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "TBD";

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Parallel Universe</h1>
          <p className="text-gray-500 text-sm mt-1">Confirm Your Demo</p>
        </div>

        {/* Proposed Time */}
        <div className="bg-purple-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Proposed Meeting Time</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{proposedTime}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Smith"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="john@company.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          <div>
            <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Time
            </label>
            <input
              type="datetime-local"
              id="datetime"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            {submitting ? "Confirming..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
