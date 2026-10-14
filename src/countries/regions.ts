import type { CountryCode } from './catalog.ts'

export const CONTINENTS = [
  'africa',
  'antarctica',
  'asia',
  'europe',
  'northAmerica',
  'oceania',
  'southAmerica',
] as const

export type Continent = (typeof CONTINENTS)[number]

// un m49 regions, with the americas split at panama. territories go where they sit
const CONTINENT_MEMBERS: Record<Continent, string> = {
  africa:
    'ao bf bi bj bw cd cf cg ci cm cv dj dz eg eh er et ga gh gm gn gq gw io ke km lr ls ly ma mg ml mr mu mw mz na ne ng re rw sc sd sh sl sn so ss st sz td tf tg tn tz ug xs yt za zm zw',
  antarctica: 'aq',
  asia: 'ae af am az bd bh bn bt cn cy ge hk id il in iq ir jo jp kg kh kp kr kw kz la lb lk mm mn mo mv my np om ph pk ps qa sa sg sy th tj tl tm tr tw uz vn xn ye',
  europe:
    'ad al at ax ba be bg by ch cz de dk ee es fi fo fr gb gg gi gr hr hu ie im is it je li lt lu lv mc md me mk mt nl no pl pt ro rs ru se si sj sk sm ua va xk',
  northAmerica:
    'ag ai aw bb bl bm bq bs bz ca cr cu cw dm do gd gl gp gt hn ht jm kn ky lc mf mq ms mx ni pa pm pr sv sx tc tt us vc vg vi',
  oceania: 'as au cc ck cx fj fm gu hm ki mh mp nc nf nr nu nz pf pg pn pw sb tk to tv um vu wf ws',
  southAmerica: 'ar bo br bv cl co ec fk gf gs gy pe py sr uy ve',
}

// iso codes without a un seat: territories, disputed land and the observers palestine and the vatican
const NOT_UN_MEMBERS = new Set(
  'ai aq as aw ax bl bm bq bv cc ck cw cx eh fk fo gf gg gi gl gp gs gu hk hm im io je ky mf mo mp mq ms nc nf nu pf pm pn pr ps re sh sj sx tc tf tk tw um va vg vi wf xk xn xs yt'.split(
    ' '
  )
)

const CONTINENT_BY_CODE = new Map<string, Continent>(
  CONTINENTS.flatMap(continent =>
    CONTINENT_MEMBERS[continent].split(' ').map(code => [code, continent] as const)
  )
)

export const getContinent = (code: CountryCode): Continent | undefined =>
  CONTINENT_BY_CODE.get(code)

export const isUnMember = (code: CountryCode): boolean => !NOT_UN_MEMBERS.has(code)
