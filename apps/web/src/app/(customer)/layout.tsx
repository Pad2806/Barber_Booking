'use client';

import { ReactNode } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { WelcomeModal } from '@/components/onboarding/OnboardingComponents';

interface CustomerLayoutProps {
  children: ReactNode;
  modal: ReactNode; // parallel route slot for intercepting modal
}

export default function CustomerLayout({ children, modal }: CustomerLayoutProps) {
  const { showWelcome, startTour, dismissWelcome, config: onboardingConfig } = useOnboarding('customer');

  return (
    <>
      {children}
      {/* Payment intercepting modal renders here (above booking page) */}
      {modal}
      {showWelcome && (
        <WelcomeModal
          title={onboardingConfig.title}
          description={onboardingConfig.description}
          onStart={startTour}
          onDismiss={dismissWelcome}
        />
      )}
    </>
  );
}
