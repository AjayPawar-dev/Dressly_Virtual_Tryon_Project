import { useCallback, useEffect, useRef, useState } from 'react';

const initialState = {
  currentStep: 1,
  history: [1],
  personImage: null,
  personImagePreview: null,
  garmentImage: null,
  garmentImagePreview: null,
  resultImage: null,
  isProcessing: false,
  processingProgress: 0,
  error: null,
};

export function useAppState() {
  const [state, setState] = useState(initialState);
  const personPreviewRef = useRef(null);
  const garmentPreviewRef = useRef(null);

  const replacePreview = useCallback((previewRef, nextPreview) => {
    if (previewRef.current && previewRef.current !== nextPreview) {
      URL.revokeObjectURL(previewRef.current);
    }

    previewRef.current = nextPreview;
  }, []);

  useEffect(() => {
    return () => {
      replacePreview(personPreviewRef, null);
      replacePreview(garmentPreviewRef, null);
    };
  }, [replacePreview]);

  const goToNextStep = useCallback(() => {
    setState(prev => {
      const next = Math.min(prev.currentStep + 1, 4);
      return { ...prev, currentStep: next, history: [...prev.history, next], error: null };
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState(prev => {
      if (prev.history.length <= 1) return prev;
      const newHistory = prev.history.slice(0, -1);
      return { ...prev, currentStep: newHistory[newHistory.length - 1], history: newHistory, error: null };
    });
  }, []);

  const reset = useCallback(() => {
    replacePreview(personPreviewRef, null);
    replacePreview(garmentPreviewRef, null);
    setState(initialState);
  }, [replacePreview]);

  const setPersonImage = useCallback((file) => {
    const preview = URL.createObjectURL(file);
    replacePreview(personPreviewRef, preview);
    setState(prev => ({ ...prev, personImage: file, personImagePreview: preview, error: null }));
  }, [replacePreview]);

  const clearPersonImage = useCallback(() => {
    replacePreview(personPreviewRef, null);
    setState(prev => ({ ...prev, personImage: null, personImagePreview: null }));
  }, [replacePreview]);

  const setGarmentImage = useCallback((file) => {
    const preview = URL.createObjectURL(file);
    replacePreview(garmentPreviewRef, preview);
    setState(prev => ({ ...prev, garmentImage: file, garmentImagePreview: preview, error: null }));
  }, [replacePreview]);

  const clearGarmentImage = useCallback(() => {
    replacePreview(garmentPreviewRef, null);
    setState(prev => ({ ...prev, garmentImage: null, garmentImagePreview: null }));
  }, [replacePreview]);

  const setResultImage = useCallback((url) => setState(prev => ({ ...prev, resultImage: url })), []);
  const setProcessing = useCallback((v) => setState(prev => ({ ...prev, isProcessing: v })), []);
  const setProgress = useCallback(
    (p) =>
      setState(prev => ({
        ...prev,
        processingProgress: Math.max(0, Math.min(100, Number(p) || 0)),
      })),
    []
  );
  const setError = useCallback((e) => setState(prev => ({ ...prev, error: e, isProcessing: false })), []);
  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);

  const reselectPerson = useCallback(() => {
    replacePreview(personPreviewRef, null);
    setState(prev => ({
      ...prev,
      personImage: null,
      personImagePreview: null,
      currentStep: 1,
      history: [1],
      error: null,
    }));
  }, [replacePreview]);

  const reselectGarment = useCallback(() => {
    replacePreview(garmentPreviewRef, null);
    setState(prev => ({
      ...prev,
      garmentImage: null,
      garmentImagePreview: null,
      currentStep: 2,
      history: [1, 2],
      error: null,
    }));
  }, [replacePreview]);

  return {
    state,
    goToNextStep, goToPreviousStep, reset,
    setPersonImage, clearPersonImage,
    setGarmentImage, clearGarmentImage,
    setResultImage, setProcessing, setProgress,
    setError, clearError,
    reselectPerson, reselectGarment,
  };
}
