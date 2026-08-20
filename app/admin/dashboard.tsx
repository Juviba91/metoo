'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Mail, Lock, Users, TrendingUp } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalBlocks: number
  failedEmails: number
  pendingEmails: number
  rateLimitHits: number
}

export function AdminDashboard({ stats }: { stats: AdminStats }) {
  const statItems = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: Lock,
      label: 'Active Blocks',
      value: stats.totalBlocks,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      icon: Mail,
      label: 'Pending Emails',
      value: stats.pendingEmails,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      icon: AlertCircle,
      label: 'Failed Emails',
      value: stats.failedEmails,
      color: 'text-destructive',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      icon: TrendingUp,
      label: 'Rate Limit Hits',
      value: stats.rateLimitHits,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {statItems.map(({ icon: Icon, label, value, color, bgColor }) => (
        <div key={label} className={`rounded-lg border border-border p-4 ${bgColor}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
            <Icon className={`size-5 ${color}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
