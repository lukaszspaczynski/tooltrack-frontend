import { createTheme, type MantineColorsTuple } from '@mantine/core'

// A single accent colour, warm enough to read as items rather than as a
// dashboard. Everything else is Mantine's default scale — this app has no
// brand to honour yet, and inventing one now would only be in the way when it
// gets one.
const amber: MantineColorsTuple = [
  '#fff8e1',
  '#ffecb3',
  '#ffe082',
  '#ffd54f',
  '#ffca28',
  '#ffc107',
  '#ffb300',
  '#ffa000',
  '#ff8f00',
  '#ff6f00',
]

export const theme = createTheme({
  colors: { amber },
  primaryColor: 'amber',
  // 6 keeps the accent readable as a background behind white text.
  primaryShade: { dark: 5, light: 7 },
  defaultRadius: 'md',
  // The app is used with gloves on, outdoors. Nothing here is a 28px control.
  components: {
    Button: { defaultProps: { size: 'md' } },
    TextInput: { defaultProps: { size: 'md' } },
    PasswordInput: { defaultProps: { size: 'md' } },
    Textarea: { defaultProps: { size: 'md' } },
    Select: { defaultProps: { size: 'md' } },
  },
})
