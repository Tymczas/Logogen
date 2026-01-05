
import React, { useState, useEffect } from 'react';
import { AppStep, LogoData, AnimationData, ImageSize, AspectRatio } from './types';
import { generateLogo, animateLogo } from './services/geminiService';

// Define Global Window Types
// Fix: Use the expected AIStudio interface and add 'readonly' modifier to match global environment.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.Setup);
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [animation, setAnimation] = useState<AnimationData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [progressMessage, setProgressMessage] = useState('');

  const loadingMessages = [
    "Synthesizing visual concepts...",
    "Perfecting geometric proportions...",
    "Applying professional color palettes...",
    "Polishing vector edges...",
    "Optimizing for education and impact...",
    "Adding that 'More Wisdom' touch..."
  ];

  const animationMessages = [
    "Infusing motion into the design...",
    "Calculating fluid dynamics...",
    "Rendering cinematic lighting...",
    "Bringing your brand to life...",
    "Finalizing visual storytelling...",
    "Just a moment longer, greatness takes time..."
  ];

  // Fix: Handle mandatory API key selection and assume success to prevent race conditions.
  const checkApiKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (hasKey) {
        setStep(AppStep.Design);
      } else {
        await window.aistudio.openSelectKey();
        setStep(AppStep.Design);
      }
    } catch (e) {
      setError("Failed to verify API key selection. Please try again.");
    }
  };

  const handleGenerateLogo = async (description: string) => {
    setIsGenerating(true);
    setError(null);
    let msgIndex = 0;
    const interval = setInterval(() => {
      setProgressMessage(loadingMessages[msgIndex % loadingMessages.length]);
      msgIndex++;
    }, 3000);

    try {
      const result = await generateLogo(description, imageSize);
      setLogo({ ...result, prompt: description });
      setStep(AppStep.Design);
    } catch (err: any) {
      // Fix: Handle "Requested entity was not found" error by prompting for API key selection.
      if (err.message?.includes("Requested entity was not found")) {
        setError("Your API key may not have access or has been reset. Please re-select.");
        await window.aistudio.openSelectKey();
      } else {
        setError(err.message || "Something went wrong while generating the logo.");
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleAnimate = async (animPrompt: string) => {
    if (!logo) return;
    setIsGenerating(true);
    setError(null);
    let msgIndex = 0;
    const interval = setInterval(() => {
      setProgressMessage(animationMessages[msgIndex % animationMessages.length]);
      msgIndex++;
    }, 4000);

    try {
      const videoUrl = await animateLogo(
        { base64: logo.base64, mimeType: logo.mimeType },
        animPrompt,
        aspectRatio
      );
      setAnimation({ videoUrl, prompt: animPrompt });
      setStep(AppStep.View);
    } catch (err: any) {
      // Fix: Add API key reset logic to the animation step as well.
      if (err.message?.includes("Requested entity was not found")) {
        setError("Your API key may not have access or has been reset. Please re-select.");
        await window.aistudio.openSelectKey();
      } else {
        setError(err.message || "Failed to animate logo.");
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const renderProgress = () => (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Magic</h2>
      <p className="text-indigo-600 font-medium animate-pulse">{progressMessage}</p>
      <p className="mt-8 text-sm text-gray-500 max-w-xs">
        High-quality AI generation typically takes between 30 seconds to 2 minutes.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center text-white text-xl">
            <i className="fas fa-brain"></i>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-gray-900">WisdomMotion</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">AI Branding Suite</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => setStep(AppStep.Design)} className={`text-sm font-semibold ${step === AppStep.Design ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>Designer</button>
          <button onClick={() => logo && setStep(AppStep.Animate)} disabled={!logo} className={`text-sm font-semibold ${!logo ? 'opacity-30' : ''} ${step === AppStep.Animate ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>Animator</button>
        </nav>
      </header>

      {isGenerating && renderProgress()}

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3">
            <i className="fas fa-exclamation-circle"></i>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {step === AppStep.Setup && (
          <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 gradient-bg rounded-3xl flex items-center justify-center text-white text-4xl mb-8 shadow-xl">
              <i className="fas fa-rocket"></i>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Let's build your brand.</h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Experience the power of Gemini 3 Pro and Veo. Design high-fidelity logos and animate them with professional-grade motion graphics in seconds.
            </p>
            <button 
              onClick={checkApiKey}
              className="px-10 py-4 gradient-bg text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-200/50 hover:-translate-y-1 transition-all duration-200 flex items-center gap-3"
            >
              Get Started
              <i className="fas fa-arrow-right"></i>
            </button>
            <p className="mt-6 text-xs text-gray-400">
              Requires a paid Google Cloud Project API Key. <a href="https://ai.google.dev/gemini-api/docs/billing" className="underline hover:text-indigo-600" target="_blank" rel="noreferrer">More info on billing</a>.
            </p>
          </div>
        )}

        {step === AppStep.Design && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Design Your Logo</h2>
                <p className="text-gray-600">Tell us about your organization. Be descriptive about colors, shapes, and feelings.</p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Logo Description</span>
                  <textarea 
                    className="mt-2 block w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-32 p-4 text-gray-800"
                    placeholder="e.g., A minimalist wise owl reading a book, blue and white theme, modern flat design for 'More Wisdom' educational foundation."
                    defaultValue={logo?.prompt || "A clean educational logo for 'More Wisdom' non-profit, featuring a stylized open book and a sun rising, blue and gold colors, minimalist vector style."}
                    id="logo-prompt"
                  ></textarea>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Image Quality</span>
                    <select 
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value as ImageSize)}
                      className="mt-2 block w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5"
                    >
                      <option value="1K">Standard (1K)</option>
                      <option value="2K">High Definition (2K)</option>
                      <option value="4K">Ultra HD (4K)</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        const prompt = (document.getElementById('logo-prompt') as HTMLTextAreaElement).value;
                        handleGenerateLogo(prompt);
                      }}
                      className="w-full py-2.5 gradient-bg text-white rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-wand-magic-sparkles"></i>
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <i className="fas fa-lightbulb"></i>
                  Pro Tip
                </h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  Mentioning "minimalist", "vector style", or "flat design" helps produce clean results that animate beautifully. Avoid too much text for the best visual impact.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6">
              <div className="w-full aspect-square bg-white rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shadow-2xl relative group">
                {logo ? (
                  <>
                    <img src={logo.url} alt="Generated Logo" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <a href={logo.url} download="logo.png" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-900 hover:scale-110 transition-transform shadow-lg">
                        <i className="fas fa-download"></i>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="text-gray-300 text-6xl mb-4">
                      <i className="fas fa-image"></i>
                    </div>
                    <p className="text-gray-400 font-medium">Your logo preview will appear here</p>
                  </div>
                )}
              </div>
              
              {logo && (
                <button 
                  onClick={() => setStep(AppStep.Animate)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-colors flex items-center justify-center gap-3"
                >
                  Next: Animate This Logo
                  <i className="fas fa-arrow-right"></i>
                </button>
              )}
            </div>
          </div>
        )}

        {step === AppStep.Animate && logo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <button onClick={() => setStep(AppStep.Design)} className="text-sm font-bold text-indigo-600 mb-4 hover:underline flex items-center gap-1">
                  <i className="fas fa-chevron-left"></i> Back to Design
                </button>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bring it to Life</h2>
                <p className="text-gray-600">Describe how you want the logo to move. Be creative!</p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Animation Motion</span>
                  <textarea 
                    className="mt-2 block w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-32 p-4 text-gray-800"
                    placeholder="e.g., The book pages slowly turn as the sun rises in the background, cinematic soft lighting, gentle floating motion."
                    defaultValue="The sun rays pulsate slowly, the book's pages shimmer with golden light, and the entire logo gently floats in a dreamlike, educational atmosphere."
                    id="animation-prompt"
                  ></textarea>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Format</span>
                    <select 
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                      className="mt-2 block w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5"
                    >
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                      <option value="1:1">Square (1:1)</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        const prompt = (document.getElementById('animation-prompt') as HTMLTextAreaElement).value;
                        handleAnimate(prompt);
                      }}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-film"></i>
                      Animate
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <i className="fas fa-info-circle"></i>
                  About Veo Animation
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Veo creates a cinematic video using your logo as the base. You can specify mood, lighting, and movement for a professional brand intro.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
               <div className="w-full max-w-md aspect-square bg-white rounded-3xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-xl mb-6">
                <img src={logo.url} alt="Static Logo Reference" className="w-full h-full object-contain opacity-50 grayscale scale-75" />
              </div>
              <p className="text-gray-400 text-sm font-medium italic">Veo will use this as the starting frame</p>
            </div>
          </div>
        )}

        {step === AppStep.View && animation && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setStep(AppStep.Animate)} className="text-sm font-bold text-indigo-600 mb-2 hover:underline flex items-center gap-1">
                  <i className="fas fa-chevron-left"></i> Change Animation
                </button>
                <h2 className="text-3xl font-bold text-gray-900">Your Animated Brand</h2>
              </div>
              <button 
                onClick={() => setStep(AppStep.Design)} 
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
              >
                Create New
              </button>
            </div>

            <div className={`w-full bg-black rounded-3xl overflow-hidden shadow-2xl ${aspectRatio === '9:16' ? 'max-w-sm mx-auto aspect-[9/16]' : 'aspect-video'}`}>
              <video 
                src={animation.videoUrl} 
                className="w-full h-full" 
                controls 
                autoPlay 
                loop
              ></video>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Logo Details</h4>
                <div className="flex items-center gap-4">
                  <img src={logo?.url} className="w-16 h-16 rounded-lg border object-contain" alt="Mini" />
                  <div>
                    <p className="text-gray-900 font-semibold line-clamp-1">{logo?.prompt}</p>
                    <p className="text-gray-500 text-sm">Created with Gemini 3 Pro</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Animation Style</h4>
                <p className="text-gray-900 font-medium italic leading-relaxed">"{animation.prompt}"</p>
                <p className="text-indigo-600 text-sm font-bold mt-2">— Veo Motion Engine</p>
              </div>
            </div>

            <div className="flex gap-4">
              <a 
                href={animation.videoUrl} 
                download="logo_animation.mp4"
                className="flex-1 py-4 gradient-bg text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 hover:-translate-y-1 transition-transform"
              >
                <i className="fas fa-download"></i>
                Download Animation
              </a>
              <button 
                onClick={() => window.print()}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-share-nodes"></i>
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 text-sm">
            © 2024 WisdomMotion Branding Engine. Powered by Google Gemini & Veo.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><i className="fab fa-twitter"></i></a>
            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><i className="fab fa-instagram"></i></a>
            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
