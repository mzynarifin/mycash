import {
  Utensils,
  Car,
  Receipt,
  ShoppingBag,
  Film,
  HeartPulse,
  BookOpen,
  Package,
  type LucideProps,
} from "lucide-react";

const iconMap: Record<string, React.FC<LucideProps>> = {
  utensils: Utensils,
  car: Car,
  receipt: Receipt,
  "shopping-bag": ShoppingBag,
  film: Film,
  "heart-pulse": HeartPulse,
  "book-open": BookOpen,
  package: Package,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(iconMap).map((key) => ({
  value: key,
  label: key
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" "),
}));

export function CategoryIcon({
  name,
  size = 18,
  className,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
} & Omit<LucideProps, "name">) {
  const Icon = iconMap[name] ?? Package;
  return <Icon size={size} className={className} {...props} />;
}