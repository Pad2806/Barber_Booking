'use client';

import { ReactNode } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { WelcomeModal } from '@/components/onboarding/OnboardingComponents';

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const { showWelcome, startTour, dismissWelcome, config: onboardingConfig } = useOnboarding('customer');

  return (
    <>
      {children}
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
