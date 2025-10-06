import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { ArrowRight, CheckCircle2, Users, TrendingUp, BarChart3, Shield, Zap, Globe, Star, Menu, X, ChevronDown } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Non reindirizziamo automaticamente gli utenti autenticati dalla landing.
  // Manteniamo la landing accessibile; i CTA portano a /login o onboarding.

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white text-xl">Caricamento...</p>
        </div>
      </div>
    );
  }

  const plans = [
    { code: 'BASIC', name: 'Basic', price: 'Gratis', priceDetail: 'Per sempre', description: 'Perfetto per iniziare', features: [
      'Dashboard base completa','Gestione fino a 25 giocatori','Contratti e documenti base','Statistiche essenziali','Supporto community','Storage 2GB'
    ], highlighted: false, cta: 'Inizia Gratis' },
    { code: 'PROFESSIONAL', name: 'Professional', price: '29€', priceDetail: 'al mese', description: 'Per club ambiziosi', features: [
      'Tutto in Basic, più:','Analytics avanzate real-time','Report personalizzati illimitati','Performance tracking GPS','Supporto prioritario 24/7','Integrazione wearables','Export dati Excel/PDF','Storage 50GB'
    ], highlighted: true, cta: 'Più Popolare' },
    { code: 'PREMIUM', name: 'Premium', price: '59€', priceDetail: 'al mese', description: 'Per professionisti', features: [
      'Tutto in Professional, più:','Analytics predittive AI','Video analysis integrata','API accesso completo','Training AI insights','Scouting avanzato','Multi-team management','Storage 200GB'
    ], highlighted: false, cta: 'Diventa Premium' },
    { code: 'ENTERPRISE', name: 'Enterprise', price: 'Custom', priceDetail: 'su misura', description: 'Per organizzazioni', features: [
      'Tutto in Premium, più:','Soluzione white-label','Account manager dedicato','SLA garantito 99.9%','Training on-site','Integrazione sistemi esistenti','Storage illimitato','Contratto personalizzato'
    ], highlighted: false, cta: 'Contattaci' }
  ];

  const features = [
    { icon: <Users className="w-8 h-8" />, title: 'Gestione Completa', description: "Organizza giocatori, staff e contratti in un'unica piattaforma centralizzata." },
    { icon: <TrendingUp className="w-8 h-8" />, title: 'Analytics Avanzate', description: 'Monitora performance e progressi con dashboard interattive e insights in tempo reale.' },
    { icon: <BarChart3 className="w-8 h-8" />, title: 'Report Automatici', description: 'Genera report professionali personalizzati con un click, pronti da condividere.' },
    { icon: <Shield className="w-8 h-8" />, title: 'Sicurezza Totale', description: 'Dati crittografati, backup automatici e conformità GDPR garantita.' },
    { icon: <Zap className="w-8 h-8" />, title: 'Veloce & Intuitivo', description: 'Interfaccia moderna e reattiva, ottimizzata per desktop e mobile.' },
    { icon: <Globe className="w-8 h-8" />, title: 'Accessibile Ovunque', description: 'Cloud-based, accessibile da qualsiasi dispositivo, in qualsiasi momento.' }
  ];

  const testimonials = [
    { name: 'Marco Bianchi', role: 'Direttore Sportivo - AC Milano Youth', content: 'Da quando usiamo Soccer X Pro, abbiamo ridotto del 70% il tempo dedicato alla burocrazia. Le analytics predittive ci hanno aiutato a identificare talenti che avremmo perso.', rating: 5, image: '👨‍💼' },
    { name: 'Laura Ferretti', role: 'Allenatrice - Roma Calcio Femminile', content: 'Finalmente una piattaforma che parla la nostra lingua. Il tracking delle performance è incredibilmente accurato e i report sono chiari anche per i genitori.', rating: 5, image: '👩‍💼' },
    { name: 'Giuseppe Verdi', role: 'Presidente - ASD Juventus Primavera', content: 'ROI incredibile. In 6 mesi abbiamo ottimizzato budget e migliorato la comunicazione interna. Il supporto clienti è eccezionale.', rating: 5, image: '👔' }
  ];

  const stats = [
    { number: '500+', label: 'Club Attivi' },
    { number: '15k+', label: 'Giocatori Gestiti' },
    { number: '99.9%', label: 'Uptime' },
    { number: '4.9/5', label: 'Rating Medio' }
  ];

  const handleGetStarted = () => {
    navigate('/onboarding/choose-plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0f]/95 backdrop-blur-lg shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-xl">S</div>
              <span className="text-xl font-bold">Soccer X Pro</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-blue-400 transition-colors">Prezzi</a>
              <a href="#testimonials" className="hover:text-blue-400 transition-colors">Testimonianze</a>
              <button onClick={() => navigate('/login')} className="px-5 py-2 border border-white/20 rounded-lg hover:bg:white/10 hover:bg-white/10 transition-all">Accedi</button>
              <button onClick={handleGetStarted} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold hover:scale-105 transition-transform">Inizia Gratis</button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0f]/98 backdrop-blur-lg border-t border-white/10">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block py-2 hover:text-blue-400 transition-colors">Features</a>
              <a href="#pricing" className="block py-2 hover:text-blue-400 transition-colors">Prezzi</a>
              <a href="#testimonials" className="block py-2 hover:text-blue-400 transition-colors">Testimonianze</a>
              <button onClick={() => navigate('/login')} className="w-full py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-all">Accedi</button>
              <button onClick={handleGetStarted} className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold">Inizia Gratis</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-8 animate-bounce">
            <Star className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Utilizzato da oltre 500 club professionisti</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">La Piattaforma Definitiva</span>
            <br />
            <span className="text-white">per il Tuo Club</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Gestisci giocatori, contratti, performance e analytics in un'unica soluzione cloud professionale. Semplice, potente, sicura.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={handleGetStarted} className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-lg hover:scale-105 transition-all shadow-2xl shadow-blue-500/50 flex items-center gap-2">
              Inizia Gratis - Nessuna Carta
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg:white/10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all" onClick={() => navigate('/login')}>
              Accedi
            </button>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">{stat.number}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <ChevronDown className="w-8 h-8 animate-bounce text-white/50" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Tutto Quello Che Ti Serve</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">Strumenti professionali pensati per semplificare la gestione del tuo club</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Piani Su Misura Per Te</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">Scegli il piano perfetto per le tue esigenze. Cambia o cancella in qualsiasi momento.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <div key={index} className={`relative p-8 rounded-2xl border transition-all duration-300 hover:scale-105 ${plan.highlighted ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500 shadow-2xl shadow-blue-500/30' : 'bg-white/5 backdrop-blur-lg border-white/10 hover:border-white/30'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-sm font-bold">Più Popolare</div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.priceDetail !== 'su misura' && <span className="text-white/60">/{plan.priceDetail}</span>}
                  </div>
                  <p className="text-sm text:white/70 text-white/70">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.highlighted ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 shadow-lg' : 'bg-white/10 hover:bg-white/20 border border-white/20'}`} onClick={() => navigate('/onboarding/choose-plan')}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/70">Tutti i piani includono 14 giorni di prova gratuita • Nessuna carta di credito richiesta • Cancellazione in qualsiasi momento</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-black/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Cosa Dicono i Nostri Clienti</h2>
            <p className="text-xl text-white/70">Oltre 500 club si fidano di Soccer X Pro ogni giorno</p>
          </div>

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">{testimonials[activeTestimonial].image}</div>
                <div>
                  <h4 className="font-bold text-xl">{testimonials[activeTestimonial].name}</h4>
                  <p className="text-white/70">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-white/80 leading-relaxed italic">"{testimonials[activeTestimonial].content}"</p>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button key={index} onClick={() => setActiveTestimonial(index)} className={`w-3 h-3 rounded-full transition-all ${activeTestimonial === index ? 'bg-blue-500 w-8' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto a Trasformare il Tuo Club?</h2>
          <p className="text-xl text-white/70 mb-10">Unisciti a centinaia di club che stanno già rivoluzionando il loro modo di lavorare</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleGetStarted} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-lg hover:scale-105 transition-all shadow-2xl shadow-blue-500/50">Inizia Gratis Oggi</button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all" onClick={() => navigate('/login')}>Accedi</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold">S</div>
                <span className="font-bold">Soccer X Pro</span>
              </div>
              <p className="text-sm text-white/60">La piattaforma completa per la gestione professionale del tuo club calcistico.</p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Prezzi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Azienda</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Chi Siamo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carriere</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contatti</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legale</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termini di Servizio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text:white/60 text-white/60">
            <p>© 2025 Soccer X Pro. Tutti i diritti riservati.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
