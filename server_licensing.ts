import { Request, Response } from "express";

export function setupLicensingRoutes(app: any) {
  // Owner Mode PIN Login (Using PIN stored in .env)
  app.post("/api/owner/login", async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ error: "PIN is required." });
      }

      const systemPin = process.env.OWNER_PIN || "2002";
      if (pin.toString().trim() === systemPin.trim()) {
        // Authenticated as Owner! Return custom unlimited access credentials
        console.log("[Owner Mode] Owner unlocked system via secure PIN.");
        res.json({
          success: true,
          role: "owner",
          tier: "lifetime",
          expiresAt: null,
          message: "Free, unrestricted lifetime access granted."
        });
      } else {
        res.status(401).json({ error: "Invalid PIN. Access denied." });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
