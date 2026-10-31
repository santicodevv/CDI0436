import { Home, Users, BookOpen, Clock, FileText, Settings, Shield, UserCog, UserCheck, UserCircle, UtensilsCrossed, Tent, BarChart3, HeartPulse, Award, Gift, Cake, Trophy, Package, ListChecks, Banknote, LifeBuoy, Inbox } from 'lucide-react';
import type { MenuItem } from '@/lib/types';

export const menuGroups: MenuItem[] = [
  {
    title: 'Inicio',
    icon: Home,
    href: '/dashboard',
  },
  {
    title: 'Participantes',
    icon: Users,
    subItems: [
      {
        title: 'Beneficiarios',
        icon: Users,
        href: '/dashboard/beneficiarios',
        permisos: ['beneficiarios:ver'],
      },
      {
        title: 'Mérito Estudiantil',
        icon: Award,
        href: '/dashboard/merito',
        permisos: ['merito:ver'],
      },
      {
        title: 'Solicitudes de Ayuda',
        icon: FileText,
        href: '/dashboard/ayudas',
        permisos: ['ayudas:ver'],
      },
      {
        title: 'Desembolsos',
        icon: Banknote,
        href: '/dashboard/desembolsos',
        permisos: ['desembolsos:ver'],
      },
      {
        title: 'Supervivencia',
        icon: Tent,
        href: '/dashboard/supervivencia',
        permisos: ['supervivencia:ver'],
      },
      {
        title: 'Cumpleaños',
        icon: Cake,
        href: '/dashboard/cumpleanos',
        permisos: ['cumpleanos:ver'],
      },
    ],
  },
  {
    title: 'Tutoría',
    icon: UserCheck,
    subItems: [
      {
        title: 'Tutores',
        icon: UserCircle,
        href: '/dashboard/tutores',
        permisos: ['tutores:ver'],
      },
      {
        title: 'Clases',
        icon: BookOpen,
        href: '/dashboard/clases',
        permisos: ['clases:ver'],
      },
      {
        title: 'Clubs',
        icon: Trophy,
        href: '/dashboard/clubs',
        permisos: ['clubs:ver'],
      },
      {
        title: 'Horarios',
        icon: Clock,
        href: '/dashboard/horarios',
        permisos: ['horarios:ver'],
      },
    ],
  },
  {
    title: 'Bienestar Integral',
    icon: HeartPulse,
    subItems: [
      {
        title: 'Nutrición',
        icon: UtensilsCrossed,
        href: '/dashboard/nutricion',
        permisos: ['nutricion:ver'],
      },
    ],
  },
  {
    title: 'Reportes',
    icon: BarChart3,
    subItems: [
      {
        title: 'Centro de Reportes',
        icon: FileText,
        href: '/dashboard/reportes',
        permisos: ['reportes:ver'],
      },
      {
        title: 'Reporte de Carpetas',
        icon: FileText,
        href: '/dashboard/reportes/carpetas',
        permisos: ['reportes:ver'],
      },
    ],
  },
  {
    title: 'Bonos',
    icon: Gift,
    subItems: [
      {
        title: 'Bonos de Navidad',
        icon: Gift,
        href: '/dashboard/bonos',
        permisos: ['bonos:ver'],
      },
      {
        title: 'Bonos de Regalos',
        icon: Package,
        href: '/dashboard/bonos/regalos',
        permisos: ['bonos:ver'],
      },
      {
        title: 'Lista de Regalos',
        icon: ListChecks,
        href: '/dashboard/bonos/lista',
        permisos: ['bonos:ver'],
      },
    ],
  },
  {
    title: 'Soporte',
    icon: LifeBuoy,
    subItems: [
      {
        title: 'Mis Tickets',
        icon: LifeBuoy,
        href: '/dashboard/tickets',
        permisos: ['tickets:crear', 'tickets:gestionar'],
      },
    ],
  },
];

export const adminGroup: MenuItem = {
  title: 'Administración',
  icon: Settings,
  subItems: [
    {
      title: 'Usuarios',
      icon: UserCog,
      href: '/dashboard/usuarios',
      permisos: ['usuarios:ver'],
    },
    {
      title: 'Asistencia Personal',
      icon: UserCheck,
      href: '/dashboard/asistencia-personal',
      permisos: ['usuarios:ver'],
    },
    {
      title: 'Roles y Permisos',
      icon: Shield,
      href: '/dashboard/roles',
      permisos: ['roles:ver'],
    },
    {
      title: 'Gestión de Tickets',
      icon: Inbox,
      href: '/dashboard/tickets/gestion',
      permisos: ['tickets:gestionar'],
    },
  ],
};
