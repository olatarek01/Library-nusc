import colorLogoAsset from "@/assets/nusc-logo-color.png.asset.json";
import lightLogoAsset from "@/assets/nusc-logo-light.png.asset.json";
import { cn } from "@/lib/utils";

export const LOGO_SRC: string = colorLogoAsset.url;

export function UniversityLogo({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const asset = variant === "dark" ? lightLogoAsset : colorLogoAsset;
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden", className)}>
      <img
        src={asset.url}
        alt="شعار جامعة مدينة السادات الأهلية"
        className="size-full object-contain"
      />
    </span>
  );
}
