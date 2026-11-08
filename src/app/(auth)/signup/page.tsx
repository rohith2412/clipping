import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { Check } from "lucide-react";

const features = [
  "AI-powered peak moment detection",
  "Auto-generate 10-20 clips per video",
  "AI voiceover generation",
  "Schedule posts to YouTube, TikTok, Instagram",
  "Burned-in captions",
  "Full clip editor",
];

export default function SignUpPage() {
  return (
    <div className="w-full max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Start clipping today</CardTitle>
          <CardDescription>
            Create your account to turn long videos into viral clips
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <GoogleSignInButton callbackUrl="/onboarding" />

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our{" "}
            <a href="/legal/terms" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/legal/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Sign Up",
};
