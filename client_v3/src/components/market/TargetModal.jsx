// client_v3/src/components/market/TargetModal.jsx
// Modal per creazione e modifica target di mercato

import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Euro, Star, Calendar, FileText } from 'lucide-react';
import Button from '@/design-system/ds/Button';
import Card, { CardContent } from '@/design-system/ds/Card';

const TargetModal = ({ open, onClose, onSubmit, initial, isViewMode = false }) => {
  // Funzione per tradurre i codici posizione in enum del database
  const translatePosition = (positionCode) => {
    const positionMapping = {
      'GK': 'GOALKEEPER',
      'CB': 'DEFENDER',
      'LB': 'DEFENDER',
      'RB': 'DEFENDER',
      'CDM': 'MIDFIELDER',
      'CM': 'MIDFIELDER',
      'CAM': 'MIDFIELDER',
      'LW': 'FORWARD',
      'RW': 'FORWARD',
      'ST': 'FORWARD'
    };
    return positionMapping[positionCode] || positionCode;
  };

  // Funzione per tradurre gli enum del database in codici frontend
  const translatePositionFromEnum = (positionEnum) => {
    const enumToCodeMapping = {
      'GOALKEEPER': 'GK',
      'DEFENDER': 'CB', // Default per DEFENDER
      'MIDFIELDER': 'CM', // Default per MIDFIELDER
      'FORWARD': 'ST' // Default per FORWARD
    };
    return enumToCodeMapping[positionEnum] || positionEnum;
  };

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nationality: '',
    position: '',
    date_of_birth: '',
    age: '',
    foot: '',
    height_cm: '',
    weight_kg: '',
    preferred_role: '',
    secondary_roles: '',
    player_style: '',
    current_club: '',
    club_country: '',
    contract_until: '',
    current_salary: '',
    market_value: '',
    previous_market_value: '',
    agent_contact_name: '',
    agent_contact_phone: '',
    priority: 3,
    status: 'SCOUTING',
    notes: '',
    overall_rating: '',
    potential_rating: '',
    transfer_likelihood: '',
    recommendation_level: 3,
    video_url: '',
    profile_url: '',
    discovery_method: '',
    scouting_source: '',
    report_confidence: '',
    last_scouted_at: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (initial) {
      setFormData({
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        nationality: initial.nationality || '',
        position: initial.position ? translatePositionFromEnum(initial.position) : '',
        date_of_birth: initial.date_of_birth ? initial.date_of_birth.split('T')[0] : '',
        age: initial.age || '',
        foot: initial.foot || '',
        height_cm: initial.height_cm || '',
        weight_kg: initial.weight_kg || '',
        preferred_role: initial.preferred_role || '',
        secondary_roles: initial.secondary_roles || '',
        player_style: initial.player_style || '',
        current_club: initial.current_club || '',
        club_country: initial.club_country || '',
        contract_until: initial.contract_until ? initial.contract_until.split('T')[0] : '',
        current_salary: initial.current_salary || '',
        market_value: initial.market_value || '',
        previous_market_value: initial.previous_market_value || '',
        agent_contact_name: initial.agent_contact_name || '',
        agent_contact_phone: initial.agent_contact_phone || '',
        priority: initial.priority || 3,
        status: initial.status || 'SCOUTING',
        notes: initial.notes || '',
        overall_rating: initial.overall_rating || '',
        potential_rating: initial.potential_rating || '',
        transfer_likelihood: initial.transfer_likelihood || '',
        recommendation_level: initial.recommendation_level || 3,
        video_url: initial.video_url || '',
        profile_url: initial.profile_url || '',
        discovery_method: initial.discovery_method || '',
        scouting_source: initial.scouting_source || '',
        report_confidence: initial.report_confidence || '',
        last_scouted_at: initial.last_scouted_at ? initial.last_scouted_at.split('T')[0] : ''
      });
    } else {
      // Reset form for new target
      setFormData({
        first_name: '',
        last_name: '',
        nationality: '',
        position: '',
        date_of_birth: '',
        age: '',
        foot: '',
        height_cm: '',
        weight_kg: '',
        preferred_role: '',
        secondary_roles: '',
        player_style: '',
        current_club: '',
        club_country: '',
        contract_until: '',
        current_salary: '',
        market_value: '',
        previous_market_value: '',
        agent_contact_name: '',
        agent_contact_phone: '',
        priority: 3,
        status: 'SCOUTING',
        notes: '',
        overall_rating: '',
        potential_rating: '',
        transfer_likelihood: '',
        recommendation_level: 3,
        video_url: '',
        profile_url: '',
        discovery_method: '',
        scouting_source: '',
        report_confidence: '',
        last_scouted_at: ''
      });
    }
    setErrors({});
  }, [initial, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'Nome è obbligatorio';
    if (!formData.last_name.trim()) newErrors.last_name = 'Cognome è obbligatorio';
    if (!formData.position) newErrors.position = 'Posizione è obbligatoria';

    // Validate numeric fields
    if (formData.height_cm && (isNaN(formData.height_cm) || formData.height_cm < 100 || formData.height_cm > 250)) {
      newErrors.height_cm = 'Altezza deve essere tra 100 e 250 cm';
    }
    if (formData.weight_kg && (isNaN(formData.weight_kg) || formData.weight_kg < 30 || formData.weight_kg > 150)) {
      newErrors.weight_kg = 'Peso deve essere tra 30 e 150 kg';
    }
    if (formData.overall_rating && (isNaN(formData.overall_rating) || formData.overall_rating < 0 || formData.overall_rating > 100)) {
      newErrors.overall_rating = 'Rating deve essere tra 0 e 100';
    }
    if (formData.potential_rating && (isNaN(formData.potential_rating) || formData.potential_rating < 0 || formData.potential_rating > 100)) {
      newErrors.potential_rating = 'Potenziale deve essere tra 0 e 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = { ...formData };
      
      // Debug: verifica i dati prima del submit
      console.log('📝 TargetModal submit data:', {
        originalPosition: formData.position,
        translatedPosition: translatePosition(formData.position),
        submitData: submitData
      });
      
      // Convert empty strings to null for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      // Convert numeric fields
      if (submitData.height_cm) submitData.height_cm = Number(submitData.height_cm);
      if (submitData.weight_kg) submitData.weight_kg = Number(submitData.weight_kg);
      if (submitData.overall_rating) submitData.overall_rating = Number(submitData.overall_rating);
      if (submitData.potential_rating) submitData.potential_rating = Number(submitData.potential_rating);
      if (submitData.priority) submitData.priority = Number(submitData.priority);
      if (submitData.recommendation_level) submitData.recommendation_level = Number(submitData.recommendation_level);

      // Translate position from frontend code to database enum
      if (submitData.position) {
        const originalPosition = submitData.position;
        submitData.position = translatePosition(submitData.position);
        console.log('🔄 Position translation:', { original: originalPosition, translated: submitData.position });
      }

      // Whitelist: invia solo i campi supportati dal backend
      const allowedKeys = [
        'first_name','last_name','nationality','position','date_of_birth','age','foot','height_cm','weight_kg',
        'preferred_role','secondary_roles','player_style','current_club','club_country','contract_until','current_salary',
        'market_value','previous_market_value','agent_contact_name','agent_contact_phone','priority','status','notes',
        'overall_rating','potential_rating','transfer_likelihood','recommendation_level','report_confidence','last_scouted_at',
        'video_url','profile_url','playerId'
      ];
      const filteredSubmitData = Object.fromEntries(
        Object.entries(submitData).filter(([k]) => allowedKeys.includes(k))
      );

      console.log('📤 Final submit data:', filteredSubmitData);
      await onSubmit(filteredSubmitData);
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        status: error.status
      });
      setError(error.message || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isViewMode ? 'Visualizza Target' : initial ? 'Modifica Target' : 'Nuovo Target'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informazioni Personali
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nazionalità
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Posizione *
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Seleziona posizione</option>
                      <option value="GK">Portiere</option>
                      <option value="CB">Difensore Centrale</option>
                      <option value="LB">Terzino Sinistro</option>
                      <option value="RB">Terzino Destro</option>
                      <option value="CDM">Centrocampista Difensivo</option>
                      <option value="CM">Centrocampista</option>
                      <option value="CAM">Trequartista</option>
                      <option value="LW">Ala Sinistra</option>
                      <option value="RW">Ala Destra</option>
                      <option value="ST">Attaccante</option>
                    </select>
                    {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data di Nascita
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Piede Preferito
                    </label>
                    <select
                      value={formData.foot}
                      onChange={(e) => handleInputChange('foot', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleziona</option>
                      <option value="LEFT">Sinistro</option>
                      <option value="RIGHT">Destro</option>
                      <option value="BOTH">Ambidestro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Altezza (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => handleInputChange('height_cm', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.height_cm ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.height_cm && <p className="text-red-500 text-xs mt-1">{errors.height_cm}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight_kg}
                      onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.weight_kg ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.weight_kg && <p className="text-red-500 text-xs mt-1">{errors.weight_kg}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Club Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Informazioni Club
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Club Attuale
                    </label>
                    <input
                      type="text"
                      value={formData.current_club}
                      onChange={(e) => handleInputChange('current_club', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Paese Club
                    </label>
                    <input
                      type="text"
                      value={formData.club_country}
                      onChange={(e) => handleInputChange('club_country', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contratto Fino al
                    </label>
                    <input
                      type="date"
                      value={formData.contract_until}
                      onChange={(e) => handleInputChange('contract_until', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stipendio Attuale
                    </label>
                    <input
                      type="number"
                      value={formData.current_salary}
                      onChange={(e) => handleInputChange('current_salary', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Euro className="w-5 h-5 mr-2" />
                  Informazioni di Mercato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valore di Mercato
                    </label>
                    <input
                      type="number"
                      value={formData.market_value}
                      onChange={(e) => handleInputChange('market_value', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valore Precedente
                    </label>
                    <input
                      type="number"
                      value={formData.previous_market_value}
                      onChange={(e) => handleInputChange('previous_market_value', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Valutazioni
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rating Attuale (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.overall_rating}
                      onChange={(e) => handleInputChange('overall_rating', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.overall_rating ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.overall_rating && <p className="text-red-500 text-xs mt-1">{errors.overall_rating}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Potenziale (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.potential_rating}
                      onChange={(e) => handleInputChange('potential_rating', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.potential_rating ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.potential_rating && <p className="text-red-500 text-xs mt-1">{errors.potential_rating}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status and Priority */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Stato e Priorità
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stato
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="SCOUTING">Scouting</option>
                      <option value="INTERESTED">Interessato</option>
                      <option value="CONTACT">In contatto</option>
                      <option value="ACTIVE">Attivo</option>
                      <option value="ARCHIVED">Archiviato</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priorità
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="1">Critica</option>
                      <option value="2">Alta</option>
                      <option value="3">Media</option>
                      <option value="4">Bassa</option>
                      <option value="5">Molto Bassa</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Note e Report
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Note
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      disabled={isViewMode}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          {!isViewMode && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvataggio...' : (initial ? 'Aggiorna' : 'Crea')}</span>
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TargetModal;