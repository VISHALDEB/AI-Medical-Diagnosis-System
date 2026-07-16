import { FiCheckCircle, FiDownload } from "react-icons/fi";

export default function ResultPage() {
  return (
    <div className="ml-64 p-10 bg-[#08111F] min-h-screen text-white">

      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <FiCheckCircle className="text-green-400" />
        Scan Result
      </h1>

      <div className="bg-[#0F1A2A] p-8 rounded-xl shadow-xl flex gap-10">

        {/* IMAGE */}
        <img
          src="/sample-xray.png"
          alt="X-ray"
          className="w-72 h-72 rounded-lg object-cover shadow-lg"
        />

        {/* DETAILS */}
        <div className="flex flex-col justify-between">

          <div>
            <h2 className="text-2xl font-bold mb-2 text-green-400">
              Normal — Low Risk
            </h2>

            <p className="text-gray-300">
              Confidence: <span className="text-white font-semibold">96%</span>
            </p>
            <p className="text-gray-300">
              Severity Level:{" "}
              <span className="text-white font-semibold">10%</span>
            </p>

            <p className="text-gray-400 mt-4 text-sm leading-relaxed">
              Your scan does not show signs of major lung abnormalities.
              Continue maintaining a healthy lifestyle and consult a doctor
              if any symptoms appear.
            </p>
          </div>

          <button className="w-fit px-6 py-3 bg-violet-500 rounded-lg hover:bg-violet-600 transition flex items-center gap-2 mt-6">
            <FiDownload />
            Download Report PDF
          </button>

        </div>
      </div>

    </div>
  );
}