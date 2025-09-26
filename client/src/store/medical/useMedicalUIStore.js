// client/src/store/medical/useMedicalUIStore.js
import { create } from 'zustand';

export const useMedicalUIStore = create((set) => ({
  // Modal states
  newInjuryOpen: false,
  setNewInjuryOpen: (v) => set({ newInjuryOpen: v }),

  newVisitOpen: false,
  setNewVisitOpen: (v) => set({ newVisitOpen: v }),

  editInjuryOpen: false,
  editInjuryId: null,
  setEditInjuryOpen: (open, id = null) => set({ editInjuryOpen: open, editInjuryId: id }),

  editVisitOpen: false,
  editVisitId: null,
  setEditVisitOpen: (open, id = null) => set({ editVisitOpen: open, editVisitId: id }),

  // Redaction mode for GDPR compliance
  redactMode: false,
  toggleRedact: () => set((s) => ({ redactMode: !s.redactMode })),

  // Filters and search
  injuryFilters: {
    status: 'ACTIVE',
    severity: '',
    bodyPart: '',
    playerId: '',
  },
  setInjuryFilters: (filters) => set((s) => ({ 
    injuryFilters: { ...s.injuryFilters, ...filters } 
  })),

  visitFilters: {
    from: '',
    to: '',
    visitType: '',
    playerId: '',
  },
  setVisitFilters: (filters) => set((s) => ({ 
    visitFilters: { ...s.visitFilters, ...filters } 
  })),

  // Calendar view
  calendarView: 'week', // 'day', 'week', 'month'
  setCalendarView: (view) => set({ calendarView: view }),

  // Selected dates
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Document upload
  uploadProgress: null,
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  // Notifications
  notifications: [],
  addNotification: (notification) => set((s) => ({ 
    notifications: [...s.notifications, { ...notification, id: Date.now() }] 
  })),
  removeNotification: (id) => set((s) => ({ 
    notifications: s.notifications.filter(n => n.id !== id) 
  })),
  clearNotifications: () => set({ notifications: [] }),

  // Loading states
  loading: {
    injuries: false,
    visits: false,
    documents: false,
    stats: false,
  },
  setLoading: (key, value) => set((s) => ({ 
    loading: { ...s.loading, [key]: value } 
  })),

  // Error states
  errors: {
    injuries: null,
    visits: null,
    documents: null,
  },
  setError: (key, error) => set((s) => ({ 
    errors: { ...s.errors, [key]: error } 
  })),
  clearError: (key) => set((s) => ({ 
    errors: { ...s.errors, [key]: null } 
  })),

  // Reset all state
  reset: () => set({
    newInjuryOpen: false,
    newVisitOpen: false,
    editInjuryOpen: false,
    editInjuryId: null,
    editVisitOpen: false,
    editVisitId: null,
    redactMode: false,
    injuryFilters: { status: 'ACTIVE', severity: '', bodyPart: '', playerId: '' },
    visitFilters: { from: '', to: '', visitType: '', playerId: '' },
    calendarView: 'week',
    selectedDate: new Date().toISOString().split('T')[0],
    uploadProgress: null,
    notifications: [],
    loading: { injuries: false, visits: false, documents: false, stats: false },
    errors: { injuries: null, visits: null, documents: null },
  }),
}));
