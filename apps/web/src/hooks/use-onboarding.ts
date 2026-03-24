'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { ActorType, ONBOARDING_CONFIGS } from '@/lib/onboarding-steps';

const STORAGE_KEY_PREFIX = 'reetro_onboarding_completed_';

export function useOnboarding(actorType: ActorType) {
  const driverRef = useRef<Driver | null>(null);
  const [isCompleted, setIsCompleted] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const key = STORAGE_KEY_PREFIX + actorType;
    const completed = localStorage.getItem(key) === 'true';
    setIsCompleted(completed);

    // Show welcome modal on first visit
    if (!completed) {
      const timer = setTimeout(() => setShowWelcome(true), 800);
      return () => clearTimeout(timer);
    }
  }, [actorType]);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    const config = ONBOARDING_CONFIGS[actorType];

    // Small delay to let welcome modal close animation finish
    setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(15, 23, 42, 0.75)',
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'reetro-tour-popover',
        progressText: '{{current}} / {{total}}',
        nextBtnText: 'Tiếp tục →',
        prevBtnText: '← Quay lại',
        doneBtnText: 'Hoàn thành ✓',
        steps: config.steps,
        onDestroyStarted: () => {
          driverObj.destroy();
          markCompleted();
        },
      });

      driverRef.current = driverObj;
      driverObj.drive();
    }, 300);
  }, [actorType]);

  const markCompleted = useCallback(() => {
    const key = STORAGE_KEY_PREFIX + actorType;
    localStorage.setItem(key, 'true');
    setIsCompleted(true);
    setShowWelcome(false);
  }, [actorType]);

  const resetTour = useCallback(() => {
    const key = STORAGE_KEY_PREFIX + actorType;
    localStorage.removeItem(key);
    setIsCompleted(false);
    startTour();
  }, [actorType, startTour]);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    markCompleted();
  }, [markCompleted]);

  return {
    isCompleted,
    showWelcome,
    startTour,
    resetTour,
    dismissWelcome,
    config: ONBOARDING_CONFIGS[actorType],
  };
}
