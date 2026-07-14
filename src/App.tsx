import { useState, useEffect } from "react";
import { 
  auth, 
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  googleProvider
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

  const handleGoogleSignIn = async () => {
    const isElectron = typeof window !== "undefined" && window.navigator.userAgent.toLowerCase().includes("electron");
    if (isElectron) {
      const { ipcRenderer } = (window as any).require("electron");
      const { idToken } = await ipcRenderer.invoke("google-signin");
      if (!idToken) {
        throw new Error("No authorization token was returned from Google Desktop Sign-In.");
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      return result.user;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  };

  const migrateLocalData = async (newUserId: string) => {
    try {
      const res = await fetch("/api/memories/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId })
      });
      return await res.json();
    } catch (err) {
      console.error("Migration error:", err);
      return { success: false, error: err };
    }
  };

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
          onSignedIn={(u) => {
            setUser(u);
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
          onSignInGoogle={handleGoogleSignIn}
          onMigrateData={migrateLocalData}
          pairedDevice={pairedDevice}
          onDevicePaired={(device) => setPairedDevice(device)}
          onDeviceDisconnected={() => setPairedDevice(null)}
          desktopBridgeToken={desktopBridgeToken}
        />
      )}
    </div>
  );
}
