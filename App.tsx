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
    <div className="min-h-screen text-cnm-white selection:bg-cnm-gold selection:text-cnm-navy font-sans antialiased overflow-x-hidden"
         style={{ background: 'linear-gradient(160deg, #0D2155 0%, #0B1628 40%, #060E1C 100%)' }}>
      {!role && <LoginView onLogin={handleLogin} />}
      {role === 'COACH' && <CoachDashboard onLogout={handleLogout} />}
      {role === 'ATHLETE' && currentAthlete && <AthleteDashboard athlete={currentAthlete} onLogout={handleLogout} />}
    </div>
  );
}