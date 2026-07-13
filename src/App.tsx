import { useState, useEffect } from "react";
import { 
  auth, 
  onAuthStateChanged,
  signOut
} from "./lib/firebase";
import { GoogleOnboarding } from "./components/GoogleOnboarding";
import { MaxAIDashboard } from "./components/MaxAIDashboard";
import { DesktopCompanion } from "./components/DesktopCompanion";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [onboardingChoice, setOnboardingChoice] = useState<"offline" | "google" | null>(
    () => (localStorage.getItem("onboarding_choice") as any) || null
  );
  
  const [pairedDevice, setPairedDevice] = useState<{ id: string; model: string; key: string; session: string } | null>(null);
  const [desktopBridgeToken, setDesktopBridgeToken] = useState<string>(() => {
    return localStorage.getItem("max_desktop_bridge_token") || "TOKEN_MX_9921_SEC";
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem("onboarding_choice", "google");
        localStorage.setItem("max_user_id", currentUser.uid);
        setOnboardingChoice("google");
      } else {
        localStorage.removeItem("max_user_id");
      }
    });
    return () => unsubscribe();
  }, []);

  const isCompanionView = typeof window !== "undefined" && window.location.search.includes("view=companion");

  if (isCompanionView) {
    return (
      <div className="w-screen h-screen bg-transparent relative overflow-hidden flex items-center justify-center">
        <DesktopCompanion
          state="disconnected"
          characterState="idle"
          activeEmotion="neutral"
          modelCaption=""
          isEmbedded={false}
        />
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setOnboardingChoice(null);
      localStorage.removeItem("onboarding_choice");
      localStorage.removeItem("max_user_id");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  return (
    <div id="maxai-operating-desktop" className="w-full h-screen bg-[#020205] text-white">
      {onboardingChoice === null && user === null ? (
        <GoogleOnboarding
          onSignedIn={() => {
            localStorage.setItem("onboarding_choice", "google");
            setOnboardingChoice("google");
          }}
          onContinueOffline={() => {
            localStorage.setItem("onboarding_choice", "offline");
            setOnboardingChoice("offline");
          }}
        />
      ) : (
        <MaxAIDashboard
          user={user}
          onSignOut={handleSignOut}
          pairedDevice={pairedDevice}
          onDevicePaired={(device) => setPairedDevice(device)}
          onDeviceDisconnected={() => setPairedDevice(null)}
          desktopBridgeToken={desktopBridgeToken}
        />
      )}
    </div>
  );
}
