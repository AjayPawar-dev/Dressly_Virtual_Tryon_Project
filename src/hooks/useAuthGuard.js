import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useAuthGuard() {
  const { user, loading, signOut } = useAuth();
  const [pendingAction, setPendingAction] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const protectedAction = async (action, actionName = 'action') => {
    if (loading) {
      console.log('Auth loading...');
      return;
    }

    if (user) {
      console.log('Executing:', actionName);
      return await action();
    }

    console.log('Auth required:', actionName);
    setPendingAction({ action, actionName });
    setShowAuthModal(true);
  };

  const onAuthSuccess = async () => {
    console.log('Auth successful');
    const nextAction = pendingAction?.action;

    setShowAuthModal(false);
    setPendingAction(null);

    if (nextAction) {
      console.log('Executing pending action');
      await nextAction();
    }
  };

  const onAuthCancel = () => {
    console.log('Auth cancelled');
    setShowAuthModal(false);
    setPendingAction(null);
  };

  return {
    user,
    loading,
    signOut,
    protectedAction,
    showAuthModal,
    setShowAuthModal,
    onAuthSuccess,
    onAuthCancel,
  };
}
