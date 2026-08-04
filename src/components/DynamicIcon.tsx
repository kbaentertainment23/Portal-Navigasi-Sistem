import React from 'react';
import {
  Globe,
  ExternalLink,
  MessageCircle,
  Instagram,
  Youtube,
  Facebook,
  FileText,
  Folder,
  Shield,
  Database,
  Mail,
  Phone,
  ShoppingBag,
  Calendar,
  HelpCircle,
  Star,
  Link as LinkIcon,
  Compass,
  LucideProps,
} from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

const iconMap: Record<string, React.FC<LucideProps>> = {
  Globe,
  ExternalLink,
  MessageCircle,
  Instagram,
  Youtube,
  Facebook,
  FileText,
  Folder,
  Shield,
  Database,
  Mail,
  Phone,
  ShoppingBag,
  Calendar,
  HelpCircle,
  Star,
  Compass,
  Link: LinkIcon,
};

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className, ...props }) => {
  if (
    typeof name === 'string' &&
    (name.startsWith('http://') ||
      name.startsWith('https://') ||
      name.startsWith('data:') ||
      name.startsWith('/'))
  ) {
    return (
      <img
        src={name}
        alt="Logo"
        className={`object-contain ${className || 'w-6 h-6'}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        {...props}
      />
    );
  }

  const IconComponent = iconMap[name] || LinkIcon;
  return <IconComponent className={className} {...props} />;
};
