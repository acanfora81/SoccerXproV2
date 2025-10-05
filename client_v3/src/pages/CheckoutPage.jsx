import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard } from "lucide-react";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const plan = params.get("plan") || "BASIC";

  const handlePayment = () => {
    setTimeout(() => navigate(`/onboarding/setup-team?plan=${plan}`), 1000);
  };

  return (
    <div className="checkout-page min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] flex flex-col items-center justify-center text-white px-6">
      <div className="text-center">
        <CreditCard className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Pagamento piano {plan}</h2>
        <p className="text-white/70 mb-6">Simulazione pagamento - nessun addebito reale</p>
        <button
          onClick={handlePayment}
          className="btn btn-primary bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 rounded-full text-lg font-semibold hover:scale-105 transition-transform"
        >
          Procedi alla creazione del team
        </button>
      </div>
    </div>
  );
}
