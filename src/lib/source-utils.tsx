import { IconMicrophone, IconBrandWhatsapp, IconUser, IconQrcode, IconMail, IconQuestionMark } from '@tabler/icons-react'

export type TaskSource = 'voice_bot' | 'whatsapp' | 'manual_entry' | 'qr_code' | 'email'

export const sourceConfig = {
  voice_bot: {
    label: 'Voice Bot',
    icon: IconMicrophone,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Created via voice bot call'
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: IconBrandWhatsapp,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Created via WhatsApp message'
  },
  manual_entry: {
    label: 'Walk-in',
    icon: IconUser,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Walk-in visitor or manual entry by staff'
  },
  qr_code: {
    label: 'QR Code',
    icon: IconQrcode,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Created via QR code scan'
  },
  email: {
    label: 'Email',
    icon: IconMail,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Created via email submission'
  }
}

export function getSourceIcon(source: TaskSource | undefined | null, className: string = 'h-4 w-4') {
  if (!source || !sourceConfig[source]) {
    return <IconQuestionMark className={`${className} text-gray-400`} title="Unknown source" />
  }
  
  const config = sourceConfig[source]
  const IconComponent = config.icon
  
  return (
    <IconComponent 
      className={`${className} ${config.color}`} 
      title={config.description}
    />
  )
}

export function getSourceLabel(source: TaskSource | undefined | null): string {
  if (!source || !sourceConfig[source]) {
    return 'Unknown'
  }
  return sourceConfig[source].label
}

export function getSourceBadgeVariant(source: TaskSource | undefined | null): string {
  if (!source || !sourceConfig[source]) {
    return 'secondary'
  }
  
  // Return appropriate badge variant based on source
  switch (source) {
    case 'voice_bot':
      return 'default'
    case 'whatsapp': 
      return 'default'
    case 'manual_entry':
      return 'outline'
    case 'qr_code':
      return 'default'
    case 'email':
      return 'default'
    default:
      return 'secondary'
  }
}