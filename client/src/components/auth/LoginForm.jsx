// client/src/components/auth/LoginForm.jsx
// 🔐 FORM LOGIN/REGISTER per Soccer X Pro Suite - Con store Zustand

import { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, User, UserPlus } from 'lucide-react';
import Logo from '../ui/Logo';
import useAuthStore from '../../store/authStore';
import '../../styles/logo.css';
import '../../styles/login.css';

const LoginForm = ({ onLoginSuccess }) => {
  // 🏪 Hook per lo store di autenticazione
  const {
    login,
    register,
    isLoading,
    error,
    clearError
  } = useAuthStore();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'SECRETARY'
  });
  const [localSuccess, setLocalSuccess] = useState('');

  console.log('🔵 LoginForm renderizzato, modalità:', isRegisterMode ? 'Register' : 'Login'); // INFO DEV - rimuovere in produzione

  // 🧹 Pulisci errori quando il componente si monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  // 🔄 Toggle between login/register
  const toggleMode = () => {
    console.log('🔵 Toggle modalità auth'); // INFO DEV - rimuovere in produzione
    setIsRegisterMode(!isRegisterMode);
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'SECRETARY'
    });
    clearError();
    setLocalSuccess('');
  };

  // 📝 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Pulisci errore quando l'utente inizia a digitare
    if (error) clearError();
    if (localSuccess) setLocalSuccess('');
  };

  // 🚀 Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalSuccess('');

    try {
      if (isRegisterMode) {
        // 📝 Registrazione
        console.log('🔵 Tentativo registrazione per:', formData.email); // INFO DEV - rimuovere in produzione
        
        const result = await register(formData);
        
        if (result.success) {
          if (result.data.access_token) {
            // Login automatico dopo registrazione - il componente si smonterà automaticamente
            console.log('🟢 Registrazione + login automatico completati'); // INFO - rimuovere in produzione
            if (onLoginSuccess) onLoginSuccess();
          } else {
            // Solo registrazione, richiede login manuale
            setLocalSuccess('Registrazione completata! Effettua il login.');
            setIsRegisterMode(false);
            setFormData({
              email: formData.email,
              password: '',
              first_name: '',
              last_name: '',
              role: 'SECRETARY'
            });
          }
        }
        // Gli errori sono gestiti dallo store
        
      } else {
        // 🔐 Login
        console.log('🔵 Tentativo login per:', formData.email); // INFO DEV - rimuovere in produzione
        
        const result = await login({
          email: formData.email,
          password: formData.password
        });
        
        if (result.success) {
          console.log('🟢 Login completato'); // INFO - rimuovere in produzione
          // Il componente si smonterà automaticamente
          if (onLoginSuccess) onLoginSuccess();
        }
        // Gli errori sono gestiti dallo store
      }
      
    } catch (err) {
      console.log('🔴 Errore generico form:', err.message); // ERROR - mantenere essenziali
    }
  };


  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-container">
              <Logo size="large" showText={true} className="login-logo" />
            </div>
            <div className="login-title-section">
              <div className="login-arrow">→</div>
              <h1 className="login-title">
                {isRegisterMode ? 'Registrazione' : 'Accesso'}
              </h1>
              <p className="login-subtitle">
                {isRegisterMode ? 'Crea un nuovo account' : 'Accedi al sistema di gestione'}
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
          {/* Email - sempre presente */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="inserisci@email.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password - sempre presente */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Lock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {/* Campi aggiuntivi per registrazione */}
          {isRegisterMode && (
            <>
              <div className="form-group">
                <label htmlFor="first_name" className="form-label">
                  <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Nome
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className="form-input"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Mario"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name" className="form-label">
                  <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Cognome
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className="form-input"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Rossi"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  <UserPlus size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Ruolo
                </label>
                <select
                  id="role"
                  name="role"
                  className="form-input"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  <option value="SECRETARY">Segreteria</option>
                  <option value="ADMIN">Amministratore</option>
                  <option value="DIRECTOR_SPORT">Direttore Sportivo</option>
                  <option value="MEDICAL_STAFF">Staff Medico</option>
                  <option value="SCOUT">Scout</option>
                  <option value="PREPARATORE_ATLETICO">Preparatore Atletico</option>
                </select>
              </div>
            </>
          )}

            {/* Messaggi di errore (dallo store) */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Messaggi di successo (locali) */}
            {localSuccess && (
              <div className="success-message">
                {localSuccess}
              </div>
            )}

            {/* Pulsante principale */}
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                isRegisterMode ? 'Registrazione...' : 'Accesso in corso...'
              ) : (
                isRegisterMode ? 'Registrati' : 'Accedi'
              )}
            </button>

          </form>

          {/* Link per toggle modalità */}
          <div className="login-link">
            <button
              type="button"
              onClick={toggleMode}
              className="login-toggle-btn"
              disabled={isLoading}
            >
              {isRegisterMode 
                ? 'Hai già un account? Accedi' 
                : 'Non hai un account? Registrati'
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginForm;