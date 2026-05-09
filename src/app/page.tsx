import Navbar from "@/components/Navbar";
import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-xl mx-auto">
          {/* Hero text */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-stone-900 leading-tight mb-3">
              Roast My{" "}
              <span className="text-brand">LinkedIn</span>
            </h1>
            <p className="text-stone-500 text-base sm:text-lg">
              Upload your profile screenshot. Get roasted by AI.{" "}
              <span className="text-stone-700 font-medium">Share the carnage.</span>
            </p>
          </div>

          <UploadForm />
        </div>
      </main>
    </>
  );
}
