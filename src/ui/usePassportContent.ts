import { type ComputedRef, computed } from 'vue'
import { type CountryCode, getTravelStats, groupByContinent } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import { buildMachineLines } from '@/passport/machine-lines'
import { type StampLabels, useStampLabels } from './useStampLabels'

interface StatRow {
  key: string
  label: string
  value: string
}

interface PassportText {
  title: string
  emptyText: string
  count: number
  countLabel: string
  statRows: StatRow[]
  machineLines: [string, string]
}

interface PassportContent {
  groups: ReturnType<typeof groupByContinent>
  stamps: (StampLabels & { code: CountryCode })[]
  text: PassportText
}

// shared by screen and export
export const usePassportContent = (
  visited: () => readonly CountryCode[]
): ComputedRef<PassportContent> => {
  const { language, t } = useI18n()
  const describeStamp = useStampLabels()
  const describeRatio = (count: number, total: number) => t('summary.count', { count, total })

  const describeStats = (stats: ReturnType<typeof getTravelStats>): StatRow[] => [
    {
      key: 'continents',
      label: t('stats.continents'),
      value: describeRatio(stats.continents.length, stats.continentTotal),
    },
    {
      key: 'unMembers',
      label: t('stats.unMembers'),
      value: describeRatio(stats.unMemberCount, stats.unMemberTotal),
    },
    { key: 'worldShare', label: t('stats.worldShare'), value: stats.worldShare },
  ]

  return computed(() => {
    const codes = visited()
    const stats = getTravelStats(codes, language.value)
    const groups = groupByContinent(codes, language.value)
    return {
      groups,
      stamps: groups.flatMap(group => group.codes).map(code => ({ code, ...describeStamp(code) })),
      text: {
        title: t('view.passport'),
        emptyText: t('passport.empty'),
        count: codes.length,
        countLabel: t('passport.countriesVisited', { count: codes.length }),
        statRows: describeStats(stats),
        machineLines: buildMachineLines({
          visited: codes,
          continentCount: stats.continents.length,
          unMemberCount: stats.unMemberCount,
        }),
      },
    }
  })
}
