import React from 'react';
import { LandingPage } from './LandingPage';

interface AuthModalProps {
  onSignedIn?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = () => {
  return <LandingPage />;
};

