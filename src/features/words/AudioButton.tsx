import { useState } from 'react'

interface Props {
  url: string | null
  label?: string
}

/** 🔊 button that plays a pronunciation clip. Disabled when there is no audio. */
export function AudioButton({ url, label }: Props) {
  const [playing, setPlaying] = useState(false)

  function play() {
    if (!url) return
    const audio = new Audio(url)
    setPlaying(true)
    audio.addEventListener('ended', () => setPlaying(false))
    audio.addEventListener('error', () => setPlaying(false))
    // play() rejects if the browser blocks it; clear the flag either way.
    audio.play().catch(() => setPlaying(false))
  }

  return (
    <button
      type="button"
      onClick={play}
      disabled={!url || playing}
      title={url ? 'Play pronunciation' : 'No audio available'}
      aria-label={label ?? 'Play pronunciation'}
    >
      🔊
    </button>
  )
}
