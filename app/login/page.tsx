import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/login.png"
          alt="Laboratory Research"
          fill
          className="absolute inset-0 h-full w-full object-cover"
          priority
        />
        {/* Overlay avec le titre principal - positionné plus haut */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                ExperimentLab
              </h1>
              <span className="text-2xl font-bold">×</span>
              <Image
                src="/Emma_Logo.png"
                alt="Emma Logo"
                width={100}
                height={50}
                className="object-contain"
              />
            </div>
            <p className="text-xl font-light opacity-90">
              Enable the power of experimentation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
