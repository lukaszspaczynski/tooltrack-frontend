import { useEffect, useRef } from 'react'

import { useSession } from '../session/SessionContext'
import { setLang, type Lang } from './index'

// The account's language wins over this browser's, because that is the whole
// point of keeping it on the account: signing in on somebody else's phone
// should not mean reading in their language.
//
// Adopted once per value rather than on every render, so switching language
// while signed in does not fight the answer still in flight: the session says
// Polish until the PATCH lands, and this has already adopted Polish, so it
// leaves the new choice alone.
export function AccountLanguage() {
  const { session } = useSession()
  const accountLang: Lang | null = session?.user.language ?? null
  const adopted = useRef<null | Lang>(null)

  useEffect(() => {
    if (!accountLang || adopted.current === accountLang) return

    adopted.current = accountLang
    setLang(accountLang)
  }, [accountLang])

  return null
}
