import Questionnaire from "@/components/Questionnaire";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-lg font-black tracking-wider">ZA SUPPORT</span>
            <span className="ml-3 text-xs text-za-green font-semibold tracking-widest uppercase hidden sm:inline">
              Practice IT. Perfected.
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Health Check Scout</p>
            <p className="text-xs text-za-green font-semibold">Security Assessment</p>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="bg-teal text-white py-5 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">Mac Security &amp; Health Assessment</h1>
          <p className="text-sm text-gray-200 mt-1">
            Answer 6 short sections to receive a personalised risk score and action plan — takes
            under 5 minutes.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Questionnaire />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-gray-400 py-4 px-6 text-center text-xs">
        <p>Practice IT. Perfected. &mdash; ZA Support (Vizibiliti Intelligent Solutions) &mdash; VAT 436-026-0014</p>
        <p className="mt-1">
          <a href="tel:+27645295863" className="hover:text-za-green transition-colors">
            064 529 5863
          </a>{" "}
          &bull;{" "}
          <a href="mailto:mary@zasupport.com" className="hover:text-za-green transition-colors">
            mary@zasupport.com
          </a>{" "}
          &bull; 1 Hyde Park Lane, Hyde Park, Johannesburg
        </p>
      </footer>
    </div>
  );
}
