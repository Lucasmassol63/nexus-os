import React, { useState } from 'react';
import { LoginView } from './components/views/LoginView';
import { CoachDashboard } from './components/views/CoachDashboard';
import { AthleteDashboard } from './components/views/AthleteDashboard';
import { UserRole, Athlete } from './types';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentAthlete, setCurrentAthlete] = useState<Athlete | undefined>(undefined);

  const handleLogin = (userRole: UserRole, user?: Athlete) => {
    setRole(userRole);
    if (userRole === 'ATHLETE') setCurrentAthlete(user);
  };

  const handleLogout = () => { setRole(null); setCurrentAthlete(undefined); };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-nexus-choco via-nexus-black to-black text-nexus-text selection:bg-nexus-red selection:text-white font-sans antialiased overflow-x-hidden">
      {!role && <LoginView onLogin={handleLogin} />}
      {role === 'COACH' && <CoachDashboard onLogout={handleLogout} />}
      {role === 'ATHLETE' && currentAthlete && <AthleteDashboard athlete={currentAthlete} onLogout={handleLogout} />}
    </div>
  );
}