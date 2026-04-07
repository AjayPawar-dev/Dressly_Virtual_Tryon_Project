import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { Shirt, Sparkles } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { ProgressTracker } from '@/components/StableProgressTracker';
import { NavigationFooter } from '@/components/NavigationFooter';
import { DownloadButton } from '@/components/DownloadButton';
import { ImageUpload } from '@/components/ImageUpload';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GarmentGallery } from '@/components/GarmentGallery';
import { TabSwitcher } from '@/components/TabSwitcher';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthModal } from '@/components/AuthModal';
import { UserMenu } from '@/components/UserMenu';
import { uploadImage, saveTryOn, updateTryOn } from '@/services/database';
import { generateTryOn } from '@/services/api';
import { cn } from '@/lib/utils';

const MotionDiv = motion.div;

const PERSON_TIPS = [
  'Full body visible from head to knees (or feet)',
  'Face forward, arms slightly away from body',
  'Plain or neutral background',
  'Even lighting - avoid harsh shadows',
];

const GARMENT_TIPS = [
  'Front-facing flat lay or mannequin photo',
  'Single garment per image',
  'Minimal background - white works best',
  'High resolution for better texture detail',
];

function isRetryableGenerationIssue(error) {
  const message = error?.message?.toLowerCase() || '';

  return Boolean(
    error?.retryable ||
      message.includes('no gpu was available') ||
      message.includes('servers are busy') ||
      message.includes('retry in a minute')
  );
}

function createGenerationCanceledError() {
  const error = new Error('Generation canceled');
  error.code = 'GENERATION_CANCELED';
  return error;
}

function getGenerationErrorMessage(error) {
  const message = error?.message?.trim() || '';

  if (!message) {
    return 'Failed to generate try-on. Please try again.';
  }

  if (error?.code === 'GENERATION_CANCELED') {
    return '';
  }

  if (isRetryableGenerationIssue(error)) {
    return message;
  }

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('timeout')) {
    return 'AI generation timed out. The service may be busy. Please try again in a few minutes.';
  }

  if (
    normalizedMessage.includes('empty result') ||
    normalizedMessage.includes('no result')
  ) {
    return 'AI service returned no result. Please try again.';
  }

  return message;
}

function VTONApp() {
  const {
    state,
    goToNextStep,
    goToPreviousStep,
    setPersonImage,
    clearPersonImage,
    setGarmentImage,
    clearGarmentImage,
    setResultImage,
    setProcessing,
    setProgress,
    setError,
    clearError,
  } = useAppState();

  const {
    user,
    loading: authLoading,
    signOut,
    protectedAction,
    showAuthModal,
    setShowAuthModal,
    onAuthSuccess,
    onAuthCancel,
  } = useAuthGuard();

  const [garmentTab, setGarmentTab] = useState('upload');
  const [selectedGarmentId, setSelectedGarmentId] = useState(null);
  const [generationComplete, setGenerationComplete] = useState(false);
  const activeGenerationIdRef = useRef(0);
  const generationAbortControllerRef = useRef(null);

  const cancelActiveGeneration = () => {
    activeGenerationIdRef.current += 1;
    generationAbortControllerRef.current?.abort();
    generationAbortControllerRef.current = null;
  };

  const assertGenerationActive = (generationId) => {
    if (activeGenerationIdRef.current !== generationId) {
      throw createGenerationCanceledError();
    }
  };

  useEffect(() => () => cancelActiveGeneration(), []);

  const canProceed = () => {
    if (state.currentStep === 1) return state.personImage !== null;
    if (state.currentStep === 2) return state.garmentImage !== null;
    if (state.currentStep === 3) return true;
    return false;
  };

  const getBackLabel = () => (state.currentStep === 4 ? 'Cancel' : 'Back');

  const getNextLabel = () => {
    if (state.currentStep === 3) return 'Generate Try-On';
    if (state.currentStep === 4) return 'View Result';
    return 'Continue';
  };

  const handleGarmentFromGallery = (file, garmentId) => {
    setSelectedGarmentId(garmentId);
    setGarmentImage(file);
  };

  const handleBack = () => {
    if (state.currentStep === 4) {
      if (state.isProcessing) {
        if (window.confirm('Cancel try-on generation in progress?')) {
          cancelActiveGeneration();
          clearError();
          setResultImage(null);
          setProcessing(false);
          setProgress(0);
          setGenerationComplete(false);
          goToPreviousStep();
        }
        return;
      }

      clearError();
      setProgress(0);
      setGenerationComplete(false);
      goToPreviousStep();
      return;
    }

    goToPreviousStep();
  };

  const handleNext = async () => {
    if (state.currentStep !== 3) {
      goToNextStep();
      return;
    }

    await protectedAction(async () => {
      const generationId = activeGenerationIdRef.current + 1;
      activeGenerationIdRef.current = generationId;

      generationAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      generationAbortControllerRef.current = abortController;

      const updateScopedProgress = (value) => {
        if (activeGenerationIdRef.current === generationId) {
          setProgress(value);
        }
      };

      goToNextStep();
      setResultImage(null);
      updateScopedProgress(0);
      setProcessing(true);
      setGenerationComplete(false);
      clearError();

      let tryonRecord = null;

      try {
        console.log('Uploading person image...');
        const personUpload = await uploadImage(state.personImage, 'person-images');
        assertGenerationActive(generationId);
        const personImageUrl = personUpload.publicUrl;
        updateScopedProgress(20);

        console.log('Uploading garment image...');
        const garmentUpload = await uploadImage(state.garmentImage, 'garment-images');
        assertGenerationActive(generationId);
        const garmentImageUrl = garmentUpload.publicUrl;
        updateScopedProgress(40);

        console.log('Creating try-on record...');
        tryonRecord = await saveTryOn(
          personImageUrl,
          garmentImageUrl,
          null,
          'processing'
        );
        assertGenerationActive(generationId);
        updateScopedProgress(50);

        console.log('Generating try-on...');
        const resultImageData = await generateTryOn(
          personUpload,
          garmentUpload,
          updateScopedProgress,
          abortController.signal
        );
        assertGenerationActive(generationId);

        if (!resultImageData) {
          throw new Error('Generation returned empty result');
        }

        updateScopedProgress(90);

        console.log('Uploading result...');
        const resultBlob = await fetch(resultImageData).then((response) => response.blob());
        assertGenerationActive(generationId);
        const resultFile = new File([resultBlob], 'result.jpg', {
          type: 'image/jpeg',
        });
        const resultUpload = await uploadImage(resultFile, 'results');
        assertGenerationActive(generationId);
        const resultImageUrl = resultUpload.publicUrl;
        updateScopedProgress(95);

        console.log('Updating try-on record...');
        await updateTryOn(tryonRecord.id, {
          result_image_url: resultImageUrl,
          status: 'completed',
        });
        assertGenerationActive(generationId);
        updateScopedProgress(100);

        setResultImage(resultImageUrl);
        setGenerationComplete(true);
        console.log('Try-on complete and saved.');
      } catch (error) {
        const wasCanceled = error?.code === 'GENERATION_CANCELED';

        if (!wasCanceled) {
          console.error('Try-on process failed:', error);
        }

        if (tryonRecord) {
          await updateTryOn(tryonRecord.id, {
            status: 'failed',
            error_message: wasCanceled
              ? 'Generation canceled by user'
              : error.message || 'Generation failed',
          }).catch(console.error);
        }

        if (activeGenerationIdRef.current === generationId) {
          updateScopedProgress(0);
          setGenerationComplete(false);

          const message = getGenerationErrorMessage(error);
          if (message) {
            setError(message);
          } else {
            clearError();
          }
        }
      } finally {
        if (generationAbortControllerRef.current === abortController) {
          generationAbortControllerRef.current = null;
        }

        if (activeGenerationIdRef.current === generationId) {
          setProcessing(false);
        }
      }
    }, 'generate-tryon');
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-gradient-card/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="glow-purple flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-lg">
            <Shirt className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-gradient-primary">
            Dressly
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {authLoading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
          ) : user ? (
            <UserMenu user={user} onSignOut={signOut} />
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white',
                'bg-gradient-primary transition-all duration-200',
                'hover:bg-gradient-primary-hover glow-purple-hover',
                'active:scale-95'
              )}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <ProgressTracker currentStep={state.currentStep} />

      <main
        key={state.currentStep}
        className={cn('flex-1 pb-32 transition-all duration-300 sm:pb-20')}
      >
        {state.currentStep === 1 && (
          <ImageUpload
            title="Upload Your Photo"
            subtitle="A clear, front-facing full-body photo gives the best results"
            existingImage={state.personImagePreview}
            onImageSelect={(file) => (file ? setPersonImage(file) : clearPersonImage())}
            guidelines={PERSON_TIPS}
          />
        )}

        {state.currentStep === 2 && (
          <div className="mx-auto max-w-4xl">
            <div className="px-4 pt-4">
              <TabSwitcher activeTab={garmentTab} onTabChange={setGarmentTab} />
            </div>

            {garmentTab === 'upload' ? (
              <ImageUpload
                title="Upload a Garment"
                subtitle="Upload the clothing item you'd like to try on"
                existingImage={state.garmentImagePreview}
                onImageSelect={(file) => {
                  setSelectedGarmentId(null);
                  file ? setGarmentImage(file) : clearGarmentImage();
                }}
                guidelines={GARMENT_TIPS}
              />
            ) : (
              <GarmentGallery
                onSelect={handleGarmentFromGallery}
                selectedId={selectedGarmentId}
              />
            )}
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-8 px-4 py-8">
            <div className="text-center">
              <h2 className="mb-2 font-display text-3xl text-gradient-primary sm:text-4xl">
                Review Your Selections
              </h2>
              <p className="font-sans text-sm text-muted-foreground">
                Make sure everything looks good before generating
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-4">
              {[
                { src: state.personImagePreview, label: 'Your Photo' },
                { src: state.garmentImagePreview, label: 'Garment' },
              ].map(({ src, label }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/20 bg-gradient-card shadow-lg">
                    {src && (
                      <img
                        src={src}
                        alt={label}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-center font-sans text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-gradient-card px-4 py-3 font-sans text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-primary-purple" />
              Click Continue to proceed to generation
            </div>
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-8">
            <div className="text-center">
              <h2 className="mb-2 font-display text-3xl text-gradient-primary sm:text-4xl">
                {generationComplete ? 'Your Result' : 'Generating...'}
              </h2>
              <p className="font-sans text-sm text-muted-foreground">
                {generationComplete
                  ? 'Your virtual try-on is ready!'
                  : 'Please wait while we generate your try-on'}
              </p>
            </div>

            {state.isProcessing && (
              <div className="w-full rounded-lg border border-white/10 bg-gradient-card p-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-purple border-t-transparent" />
                  <span className="text-sm font-medium text-foreground">
                    Generating your try-on...
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-primary transition-all duration-300"
                    style={{ width: `${state.processingProgress}%` }}
                  />
                </div>
                <p className="sr-only" aria-live="polite">
                  Generation progress is {state.processingProgress} percent complete.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {state.processingProgress}% complete - This may take 30-60 seconds
                </p>
              </div>
            )}

            {state.error && (
              <div
                className="w-full rounded-lg border border-brand-error/30 bg-brand-error/10 px-4 py-3"
                aria-live="polite"
              >
                <p className="font-sans text-sm text-brand-error">{state.error}</p>
              </div>
            )}

            {generationComplete && state.resultImage && (
              <div className="flex flex-col items-center gap-4">
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.985, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.34, ease: 'easeOut' }}
                  className="group relative"
                >
                  <img
                    src={state.resultImage}
                    alt="Try-on result"
                    className="max-h-[500px] rounded-2xl border border-white/20 shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                </MotionDiv>

                <DownloadButton
                  imageUrl={state.resultImage}
                  filename="dressly-tryon-result.jpg"
                  className="sm:min-w-[240px]"
                />
              </div>
            )}

            {!generationComplete && !state.isProcessing && (
              <div className="flex aspect-[3/4] w-full max-w-sm items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-gradient-card">
                <div className="p-6 text-center">
                  <Sparkles className="mx-auto mb-3 h-12 w-12 text-primary-purple opacity-50" />
                  <p className="font-sans text-sm text-muted-foreground">
                    Your result will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <NavigationFooter
        showBack={state.currentStep > 1}
        backLabel={getBackLabel()}
        onBack={handleBack}
        onNext={state.currentStep === 4 ? null : handleNext}
        nextLabel={getNextLabel()}
        nextDisabled={!canProceed()}
        isProcessing={state.isProcessing}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={onAuthCancel}
        onSuccess={onAuthSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="dressly-theme"
    >
      <VTONApp />
    </ThemeProvider>
  );
}
