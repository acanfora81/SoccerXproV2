// client/src/pages/LandingPage.jsx
// Landing page principale con piani di abbonamento e login

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Shield,
  BarChart3,
  Zap,
  Crown,
  LogIn,
  Sun,
  Moon
} from 'lucide-react';
import '../styles/landing.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Recupera il tema salvato o usa light come default
    const savedTheme = localStorage.getItem('soccerxpro-theme');
    return savedTheme === 'dark';
  });

  // Applica il tema al caricamento della pagina
  useEffect(() => {
    const savedTheme = localStorage.getItem('soccerxpro-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      setIsDarkTheme(savedTheme === 'dark');
    } else {
      // Default light theme
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('soccerxpro-theme', 'light');
    }
  }, []);

  // Piani di abbonamento con dettagli completi
  const plans = {
    BASIC: {
      name: 'Basic',
      price: 'Gratuito',
      priceMonthly: 0,
      maxUsers: 5,
      maxPlayers: 25,
      features: [
        'Dashboard base',
        'Gestione giocatori',
        'Contratti base',
        'Statistiche essenziali',
        'Supporto community'
      ],
      popular: false,
      icon: Building2,
      color: '#6b7280'
    },
    PROFESSIONAL: {
      name: 'Professional',
      price: '29€/mese',
      priceMonthly: 29,
      maxUsers: 15,
      maxPlayers: 50,
      features: [
        'Tutto del Basic',
        'Analytics avanzate',
        'Report personalizzati',
        'Performance tracking',
        'Supporto prioritario',
        'Integrazione GPS'
      ],
      popular: false,
      icon: BarChart3,
      color: '#8b5cf6'
    },
    PREMIUM: {
      name: 'Premium',
      price: '59€/mese',
      priceMonthly: 59,
      maxUsers: 30,
      maxPlayers: 100,
      features: [
        'Tutto del Professional',
        'Report avanzati',
        'Analytics predittive',
        'API accesso',
        'Multi-season data',
        'Training AI insights'
      ],
      popular: false,
      icon: Crown,
      color: '#f59e0b'
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 'Su richiesta',
      priceMonthly: 'custom',
      maxUsers: 100,
      maxPlayers: 250,
      features: [
        'Tutto del Premium',
        'API completa',
        'Supporto dedicato',
        'Custom integrations',
        'White-label option',
        'SLA garantito'
      ],
      popular: false,
      icon: Shield,
      color: '#10b981'
    }
  };

  const handleChoosePlan = (planKey) => {
    // Tutti i piani vanno al form unificato di registrazione
    navigate(`/signup?plan=${planKey}`);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };


  const handleThemeToggle = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setIsDarkTheme(!isDarkTheme);
    
    // Salva la preferenza
    localStorage.setItem('soccerxpro-theme', newTheme);
    
    // Applica il tema immediatamente
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Building2 size={32} />
              <span className="logo-text">Soccer X Pro Suite</span>
            </div>
            <nav className="nav-links">
              <button 
                onClick={handleThemeToggle}
                className="theme-toggle-btn"
                title={isDarkTheme ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
              >
                {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={handleLoginClick}
                className="btn btn-outline"
              >
                <LogIn size={18} />
                Accedi
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Gestisci il tuo team sportivo
                <span className="highlight"> come un professionista</span>
              </h1>
              <p className="hero-description">
                La piattaforma completa per la gestione di squadre sportive. 
                Performance, contratti, analytics e molto altro in un'unica soluzione.
              </p>
              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Team attivi</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">15K+</div>
                  <div className="stat-label">Giocatori gestiti</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">98%</div>
                  <div className="stat-label">Soddisfazione</div>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="dashboard-preview">
                <div className="preview-header">
                  <div className="preview-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="preview-title">Soccer X Pro Suite Dashboard</span>
                </div>
                <div className="preview-content">
                  <div className="preview-cards">
                    <div className="preview-card">
                      <Users size={24} />
                      <span>25 Giocatori</span>
                    </div>
                    <div className="preview-card">
                      <BarChart3 size={24} />
                      <span>Analytics</span>
                    </div>
                    <div className="preview-card">
                      <Zap size={24} />
                      <span>Performance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Tutto quello che serve per gestire il tuo team</h2>
            <p>Strumenti professionali per allenatori, dirigenti e staff tecnico</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3>Gestione Giocatori</h3>
              <p>Anagrafica completa, contratti, statistiche e storico performance</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={32} />
              </div>
              <h3>Analytics Avanzate</h3>
              <p>Insights dettagliati su performance, carico di lavoro e progressi</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>Sicurezza Dati</h3>
              <p>Protezione massima per i dati sensibili del tuo team</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={32} />
              </div>
              <h3>Integrazione GPS</h3>
              <p>Sincronizzazione automatica con dispositivi di tracking</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2>Scegli il piano perfetto per il tuo team</h2>
            <p>Inizia gratuitamente, scala quando cresci</p>
          </div>
          <div className="pricing-grid">
            {Object.entries(plans).map(([planKey, plan]) => {
              const IconComponent = plan.icon;
              return (
                <div
                  key={planKey}
                  className="pricing-card"
                >
                  <div className="plan-header">
                    <div className="plan-icon" style={{ color: plan.color }}>
                      <IconComponent size={32} />
                    </div>
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-price">{plan.price}</div>
                  </div>
                  <div className="plan-limits">
                    <div className="limit-item">
                      <Users size={16} />
                      <span>Fino a {plan.maxUsers} utenti</span>
                    </div>
                    <div className="limit-item">
                      <Building2 size={16} />
                      <span>Fino a {plan.maxPlayers} giocatori</span>
                    </div>
                  </div>
                  <div className="plan-features">
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>
                          <CheckCircle size={16} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => handleChoosePlan(planKey)}
                    className="btn btn-outline"
                  >
                    {planKey === 'BASIC' ? 'Inizia Gratis' : 'Scegli Piano'}
                    <ArrowRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Pronto a portare il tuo team al livello successivo?</h2>
            <p>Unisciti a centinaia di team che già usano Soccer X Pro Suite per eccellere</p>
            <div className="cta-actions">
              <button 
                onClick={() => handleChoosePlan('BASIC')}
                className="btn btn-outline btn-large"
              >
                Inizia Gratis
                <ArrowRight size={20} />
              </button>
              <button 
                onClick={handleLoginClick}
                className="btn btn-outline btn-large"
              >
                <LogIn size={20} />
                Ho già un account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <Building2 size={24} />
                <span className="logo-text">Soccer X Pro Suite</span>
              </div>
              <p>La piattaforma professionale per la gestione di team sportivi</p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Prodotto</h4>
                <ul>
                  <li><a href="#features">Funzionalità</a></li>
                  <li><a href="#pricing">Prezzi</a></li>
                  <li><a href="#security">Sicurezza</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Supporto</h4>
                <ul>
                  <li><a href="#help">Centro Aiuto</a></li>
                  <li><a href="#contact">Contatti</a></li>
                  <li><a href="#api">API Docs</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Soccer X Pro Suite. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
