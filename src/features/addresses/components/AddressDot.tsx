import { IconMapPin } from '@tabler/icons-react'

// The identifying colour, drawn where a place is named.
//
// The whole point of the colour is being recognised without reading, so it has
// to appear everywhere the name does — the list, the select, both detail pages
// — and it has to be one component, or the dot in one place ends up a different
// size from the dot in another and stops reading as the same thing.
//
// A place nobody has coloured falls back to the pin rather than to a grey dot:
// grey is a colour somebody might have picked, and "not coloured" has to look
// different from "coloured grey".
export function AddressDot({ color, size = 14 }: { color: string; size?: number }) {
  if (!color) return <IconMapPin size={size + 1} style={{ flexShrink: 0 }} />

  return (
    <span
      aria-hidden
      style={{
        backgroundColor: color,
        borderRadius: '50%',
        display: 'inline-block',
        flexShrink: 0,
        height: size,
        // A light colour on a white card is invisible without it, and the ring
        // is what makes a yellow place readable beside a dark green one.
        outline: '1px solid rgba(0, 0, 0, 0.18)',
        outlineOffset: -1,
        width: size,
      }}
    />
  )
}
