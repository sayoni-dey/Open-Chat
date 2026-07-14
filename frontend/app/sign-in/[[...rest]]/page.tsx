import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="absolute h-[500px] w-[500px] rounded-full bg-zinc-800/20 blur-3xl" />
      <SignIn
        appearance={{
          variables: {
            // Brand
            colorPrimary: "#fafafa",
            colorPrimaryForeground: "#09090b",

            // Base
            colorBackground: "#212121",
            colorForeground: "#fafafa",
            colorMutedForeground: "#a1a1aa",

            // Inputs
            colorInput: "#18181b",
            colorInputForeground: "#fafafa",

            // UI
            colorBorder: "#27272a",
            colorNeutral: "#27272a",
            colorRing: "#fafafa",

            borderRadius: "0.75rem",
            fontFamily: "Inter, sans-serif",
          },

          elements: {
            // Root
            rootBox: "w-full",
            card: `
              bg-zinc-900
              border border-zinc-700
              rounded-2xl
              shadow-[0_20px_60px_rgba(0,0,0,0.55)]
            `,

            // Header
            headerTitle:
              "text-zinc-50 text-2xl font-semibold tracking-tight",

            headerSubtitle:
              "text-zinc-400",

            // Labels
            formFieldLabel:
              "text-zinc-300 font-medium",

            // Inputs
            formFieldInput: `
              bg-zinc-800
              border
              border-zinc-600
              text-zinc-100
              placeholder:text-zinc-500
              focus:border-zinc-400
              transition-colors
            `,

            // Main button
            formButtonPrimary: `
              bg-zinc-50
              text-zinc-950
              hover:bg-zinc-200
              font-medium
              transition-all
              shadow-none
            `,

            // Social buttons
            socialButtonsBlockButton: `
                !bg-zinc-900
                !border
                !border-zinc-600
                hover:bg-zinc-700
                hover:border-zinc-500
                transition-all
                duration-200
                rounded-lg
            `,

            socialButtonsBlockButtonText:
              "text-zinc-100 font-medium",

            socialButtonsProviderIcon:
              "brightness-100",

            // Divider
            dividerLine:
              "bg-zinc-700",

            dividerText:
              "text-zinc-500",

            // Footer
            footerActionText:
              "text-zinc-400",

            footerActionLink:
              "text-zinc-100 hover:text-white underline-offset-4 hover:underline",

            formFieldSuccessText:
              "text-green-400",

            formFieldErrorText:
              "text-red-400",

            identityPreviewText:
              "text-zinc-100",

            otpCodeFieldInput: `
              bg-zinc-900
              border-zinc-700
              text-zinc-100
            `,
          },
        }}
      />
    </div>
  );
}