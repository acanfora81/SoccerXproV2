// client/src/pages/CheckoutPage.jsx
// Pagina di checkout per piani a pagamento

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle, 
  CreditCard,
  Shield,
  Clock
} from 'lucide-react';
import '../styles/checkout.css';

const CheckoutPage = () => {
  const { plan } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: info, 2: payment, 3: success
  const [formData, setFormData] = useState({
    teamName: '',
    email: '',
    firstName: '',
    lastName: '',
    plan: plan || 'PROFESSIONAL'
  });

  // Dati dei piani
  const planDetails = {
    PROFESSIONAL: {
      name: 'Professional',
      price: '29€/mese',
      priceMonthly: 29,
      features: ['Analytics avanzate', 'Report personalizzati', 'Supporto prioritario']
    },
    PREMIUM: {
      name: 'Premium', 
      price: '59€/mese',
      priceMonthly: 59,
      features: ['Report avanzati', 'Analytics predittive', 'API accesso']
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 'Su richiesta',
      priceMonthly: 'custom',
      features: ['API completa', 'Supporto dedicato', 'Custom integrations']
    }
  };

  const currentPlan = planDetails[plan?.toUpperCase()] || planDetails.PROFESSIONAL;

  useEffect(() => {
    // Redirect se piano non valido o gratuito
    if (!plan || plan.toUpperCase() === 'BASIC') {
      navigate('/signup');
    }
  }, [plan, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const handleContinue = () => {
    if (step === 1) {
      // Validazione dati team
      if (!formData.teamName || !formData.email || !formData.firstName || !formData.lastName) {
        alert('Completa tutti i campi obbligatori');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Simulazione pagamento
      setTimeout(() => {
        setStep(3);
      }, 2000);
    }
  };

  const handleGoToDashboard = () => {
    // Per ora redirect al signup - in futuro qui ci sarà l'integrazione di pagamento reale
    navigate(`/signup?plan=${plan}&payment=completed`);
  };

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <div className="container">
          <div className="header-content">
            <button onClick={handleBack} className="back-btn">
              <ArrowLeft size={20} />
              Indietro
            </button>
            <div className="logo">
              <Building2 size={24} />
              <span>Soccer X Pro Suite</span>
            </div>
            <div className="step-indicator">
              Passo {step} di 3
            </div>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="container">
          <div className="checkout-layout">
            {/* Contenuto principale */}
            <div className="checkout-main">
              {step === 1 && (
                <div className="step-content">
                  <h1>Informazioni del team</h1>
                  <p>Iniziamo con i dettagli base del tuo team</p>

                  <form className="checkout-form">
                    <div className="form-group">
                      <label htmlFor="teamName">Nome del team *</label>
                      <input
                        type="text"
                        id="teamName"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        placeholder="Es. AC Milan"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">Nome *</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Nome"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="lastName">Cognome *</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Cognome"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email amministratore *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="admin@example.com"
                        required
                      />
                      <small>Questa sarà la tua email di accesso</small>
                    </div>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="step-content">
                  <h1>Pagamento</h1>
                  <p>Completa l'acquisto del piano {currentPlan.name}</p>

                  <div className="payment-demo">
                    <div className="demo-notice">
                      <Shield size={24} />
                      <div>
                        <h3>Demo di pagamento</h3>
                        <p>Questa è una simulazione. In produzione qui ci sarà l'integrazione con Stripe/PayPal.</p>
                      </div>
                    </div>

                    <div className="payment-form">
                      <div className="form-group">
                        <label>Numero carta</label>
                        <div className="card-input">
                          <CreditCard size={20} />
                          <input 
                            type="text" 
                            placeholder="4242 4242 4242 4242" 
                            disabled 
                          />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Scadenza</label>
                          <input type="text" placeholder="MM/YY" disabled />
                        </div>
                        <div className="form-group">
                          <label>CVC</label>
                          <input type="text" placeholder="123" disabled />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="step-content success-step">
                  <div className="success-icon">
                    <CheckCircle size={64} />
                  </div>
                  <h1>Pagamento completato!</h1>
                  <p>
                    Il tuo team <strong>{formData.teamName}</strong> è stato creato con successo.
                    Piano attivato: <strong>{currentPlan.name}</strong>
                  </p>
                  
                  <div className="next-steps">
                    <h3>Prossimi passi:</h3>
                    <ul>
                      <li>Accedi al dashboard del tuo team</li>
                      <li>Invita i membri del tuo staff</li>
                      <li>Inizia a caricare i dati dei giocatori</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="checkout-actions">
                {step < 3 && (
                  <button 
                    onClick={handleContinue}
                    className="btn btn-primary btn-large"
                  >
                    {step === 1 ? 'Continua' : 'Completa Pagamento'}
                  </button>
                )}
                
                {step === 3 && (
                  <button 
                    onClick={handleGoToDashboard}
                    className="btn btn-primary btn-large"
                  >
                    Vai al Dashboard
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar riepilogo */}
            <div className="checkout-sidebar">
              <div className="order-summary">
                <h3>Riepilogo ordine</h3>
                
                <div className="plan-summary">
                  <h4>{currentPlan.name}</h4>
                  <div className="plan-price">{currentPlan.price}</div>
                </div>

                <div className="plan-features">
                  <h5>Incluso:</h5>
                  <ul>
                    {currentPlan.features.map((feature, index) => (
                      <li key={index}>
                        <CheckCircle size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="trial-info">
                  <Clock size={16} />
                  <span>30 giorni di prova gratuita</span>
                </div>

                <div className="total">
                  <div className="total-line">
                    <span>Subtotale</span>
                    <span>{currentPlan.price}</span>
                  </div>
                  <div className="total-line">
                    <span>IVA (22%)</span>
                    <span>
                      {currentPlan.priceMonthly !== 'custom' 
                        ? `€${Math.round(currentPlan.priceMonthly * 0.22)}`
                        : 'Da calcolare'
                      }
                    </span>
                  </div>
                  <div className="total-line total-final">
                    <span>Totale</span>
                    <span>
                      {currentPlan.priceMonthly !== 'custom'
                        ? `€${Math.round(currentPlan.priceMonthly * 1.22)}`
                        : 'Su richiesta'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
