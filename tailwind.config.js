import defaultTheme from 'tailwindcss/defaultTheme'

// This file turns the "Systematic Integrity" design spec into reusable
// Tailwind utility names, so every component pulls colors/type/spacing
// from ONE place instead of components hardcoding hex values everywhere.
//
// Note: several of the spec's exact values (#F8FAFC, #E2E8F0, 0.25rem,
// 0.5rem) already ARE Tailwind's built-in slate-50 / slate-200 / rounded /
// rounded-lg values — so those are used directly in components without
// needing a custom token here. We only add tokens for things Tailwind
// doesn't already have a matching default for.
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // #1E40AF is exactly Tailwind's blue-800, but we alias it as
        // "primary" so components express INTENT ("this is the brand/
        // primary action color") rather than an incidental shade name.
        // If the brand color ever changes, this is the one line to edit.
        primary: {
          DEFAULT: '#1E40AF',
          hover: '#1E3A8A', // blue-900 — used for :hover/:active states
        },
      },
      fontFamily: {
        // Prepending Inter to Tailwind's default sans stack means: use
        // Inter if it loaded (see index.html <link>), otherwise fall back
        // to the OS system font instead of a broken/blank font.
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        // Custom type scale from the design spec, named by ROLE
        // (headline-lg, data-value, ...) instead of raw pixel size, so a
        // template like <h1 class="text-headline-lg"> reads as "this is a
        // page headline" rather than "this happens to be 30px".
        'headline-lg': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }], // 30px/600
        'headline-md': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }], // 24px/600
        'headline-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }], // 18px/600
        'body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '400' }], // 16px/400
        'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }], // 14px/400
        // label-caps still needs `uppercase` applied as a separate utility
        // class — font-size tokens can't set text-transform.
        'label-caps': ['0.75rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.05em' }], // 12px/600
        'data-value': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }], // 14px/500 — table cell values
        'data-label': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }], // 12px/400 — field labels
      },
      boxShadow: {
        // Spec: "subtle 15%-opacity/8px-blur shadow" for modals — NOT the
        // heavy default Tailwind shadow-xl/2xl, so it gets its own token.
        modal: '0 8px 8px -2px rgb(15 23 42 / 0.15)',
      },
      backdropBlur: {
        // Spec calls for exactly 5px; Tailwind's built-in scale jumps from
        // sm (4px) to default (8px) with nothing at 5px.
        modal: '5px',
      },
      zIndex: {
        // App-wide stacking scale, named by ROLE (same reasoning as the
        // color/fontSize tokens above) so every layer's place relative to
        // the others is decided here once, not re-guessed per component.
        // Toast MUST outrank modal: a toast often reports an in-progress
        // error from an action a still-open modal just triggered (e.g. an
        // upload failing), so it has to render crisply on top of the
        // modal's backdrop blur, never underneath it.
        dropdown: '30', // reserved for future custom dropdown/popover menus
        modal: '50',    // BaseModal's backdrop + panel (one stacking unit)
        toast: '60',    // ToastHost — always the topmost layer
      },
    },
  },
  plugins: [],
}
